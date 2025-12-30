## Stripe Integration – SignalFinder.ai

### 0. Guía ultra-resumida: qué hay que hacer, paso a paso

1. **Crear cuenta de Stripe (si no la tienes)**  
   - Ir a `https://dashboard.stripe.com` y crear cuenta.

2. **Crear producto + precio PRO en Stripe**  
   - En Dashboard → Products → *Add product* → crea tu plan PRO (mensual).  
   - Copia el **Price ID** (ej: `price_123...`) → lo usarás como `STRIPE_PRICE_ID_PRO`.

3. **Configurar variables de entorno**  
   - En **Supabase → Project Settings → Edge Functions → Secrets** añade:
     - `STRIPE_SECRET_KEY=sk_test_...`
     - `STRIPE_PRICE_ID_PRO=price_...` (el de arriba)
     - `SITE_URL=http://localhost:3000` (en local) o tu dominio en producción
     - `SUPABASE_URL=...` (ya lo tienes en el proyecto)
     - `SUPABASE_SERVICE_ROLE_KEY=...` (service role key de Supabase)
   - (Opcional frontend) En `.env.local` añade:
     - `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`

4. **Asegurar la tabla `profiles`** (en Supabase SQL Editor)  
   - Ejecutar el `ALTER TABLE` que está en la sección **2. Modelo de Datos (Supabase)** de este archivo.

5. **Crear Edge Function `create-checkout-session`**  
   - En tu carpeta de funciones Supabase: `supabase/functions/create-checkout-session/index.ts`.  
   - Copia el código de la sección **5.1 `create-checkout-session`**.
   - Desplegarla con:
     ```bash
     supabase functions deploy create-checkout-session
     ```

6. **Crear Edge Function `stripe-webhook`**  
   - Crear `supabase/functions/stripe-webhook/index.ts`.  
   - Copiar el código de **5.2 `stripe-webhook`**.  
   - Desplegarla:
     ```bash
     supabase functions deploy stripe-webhook
     ```

7. **Configurar Webhook en Stripe**  
   - En Stripe Dashboard → Developers → Webhooks → *Add endpoint*  
   - URL: `https://TU-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`  
   - Eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`.  
   - Copia el **Signing secret** y añádelo en Supabase secrets como `STRIPE_WEBHOOK_SECRET`.

8. **Crear Edge Function `create-portal-session`** (opcional pero recomendado)  
   - Crear `supabase/functions/create-portal-session/index.ts`.  
   - Copiar el código de **5.3 `create-portal-session`**.  
   - Desplegarla:
     ```bash
     supabase functions deploy create-portal-session
     ```

9. **Actualizar el frontend (`UserMenu.tsx`)**  
   - Importar `supabase` del cliente.  
   - Reemplazar el botón “Mejorar a PRO” para que llame a `supabase.functions.invoke('create-checkout-session', { body: { userId: user.id } })` y redirija a `data.url`.  
   - Si `profile.is_pro` es `true`, mostrar un botón “Gestionar Suscripción” que llame a `create-portal-session`.  
   - Ver detalle en sección **6.2 `UserMenu.tsx`**.

10. **Manejar `success` / `canceled` en `App.tsx`**  
    - Añadir el `useEffect` de la sección **6.3** para leer `?success=true` o `?canceled=true` y llamar a `refreshProfile()`.

11. **Probar en modo test**  
    - Ejecutar la app (`npm run dev`).  
    - Loguearte, pulsar “Mejorar a PRO” → completar pago con tarjeta test `4242 4242 4242 4242`.  
    - Verificar en Supabase que `profiles.is_pro = true` y `credits_limit` ha subido.  
    - Probar también el Customer Portal.

---

### 1. Objetivo

Implementar pagos recurrentes (suscripción PRO) usando **Stripe** como pasarela de pago y **Supabase** como backend, controlando el acceso mediante:
- `profiles.is_pro`
- `profiles.credits_limit`
- `profiles.credits_used`

El frontend es una SPA en React/TypeScript; toda la lógica sensible de Stripe vive en **Supabase Edge Functions**.

---

### 2. Modelo de Datos (Supabase)

Tabla `profiles` (vinculada a `auth.users`):

- `id` (UUID, PK) – mismo id que `auth.users`
- `email` (TEXT)
- `full_name` (TEXT, nullable)
- `credits_used` (INTEGER, default 0)
- `credits_limit` (INTEGER, default 5 para free)
- `is_pro` (BOOLEAN, default false)
- `stripe_customer_id` (TEXT, nullable)

Si falta algún campo:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
```

---

### 3. Sistema de Créditos

- Cada búsqueda con `handleSearch()` en `App.tsx`:
  - Ejecuta el análisis con Gemini
  - Al terminar con éxito llama a `supabase.rpc('increment_credits', { row_id: user.id })`
  - Se asume que el RPC incrementa `credits_used` en la tabla `profiles`.
- En `UserMenu.tsx`:
  - `limit = profile.credits_limit ?? 5`
  - `used = profile.credits_used ?? 0`
  - `creditsLeft = Math.max(0, limit - used)`
- En `AuthContext.tsx`:
  - Si no hay perfil aún, crea un perfil “fallback” en memoria con `credits_limit: 5`, `is_pro: false`.

> Decisión pendiente: al renovar la suscripción mensual, ¿se debe resetear `credits_used = 0` o sólo mantener un `credits_limit` alto? (recomendación: resetear `credits_used` cada ciclo).

---

### 4. Flujo de Suscripción PRO (alto nivel)

1. Usuario está logueado (Supabase Auth).
2. Desde `UserMenu.tsx`, pulsa **"Mejorar a PRO"**.
3. El frontend llama a la Edge Function `create-checkout-session` vía `supabase.functions.invoke`.
4. La función:
   - Recupera el perfil en `profiles`.
   - Crea (o reutiliza) un `stripe_customer_id` en Stripe.
   - Crea una `Checkout Session` de Stripe (`mode: 'subscription'`).
   - Devuelve una `url` para redirigir al checkout.
5. Stripe redirige a la app en `success_url` o `cancel_url`.
6. Stripe envía eventos al webhook `stripe-webhook`:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
7. El webhook actualiza `profiles`:
   - Activa `is_pro` y ajusta `credits_limit`.
   - Opcionalmente resetea `credits_used`.
8. Cuando `is_pro = true`, el menú muestra **"Gestionar Suscripción"** que abre el **Stripe Customer Portal** vía Edge Function `create-portal-session`.

---

### 5. Edge Functions en Supabase

#### 5.1 `create-checkout-session`

Responsable de:
- Recibir `userId` (y opcionalmente `priceId`).
- Crear/recuperar `stripe_customer_id` en Stripe.
- Guardar `stripe_customer_id` en `profiles`.
- Crear una Checkout Session y devolver la URL.

Esquema base (Deno + Stripe + Supabase):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
})

serve(async (req) => {
  try {
    const { userId, priceId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }

    const finalPriceId = priceId || Deno.env.get("STRIPE_PRICE_ID_PRO")

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price: finalPriceId,
        quantity: 1,
      }],
      success_url: `${Deno.env.get("SITE_URL")}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${Deno.env.get("SITE_URL")}/?canceled=true`,
      metadata: { userId },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
```

---

#### 5.2 `stripe-webhook`

Responsable de:
- Validar la firma del webhook (`stripe-signature` + `STRIPE_WEBHOOK_SECRET`).
- Manejar eventos:
  - `checkout.session.completed` → activar PRO.
  - `invoice.payment_succeeded` → renovar PRO y opcionalmente resetear créditos.
  - `customer.subscription.deleted` → volver a free.
  - `customer.subscription.updated` → mantener estado consistente.

Esquema base:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "")

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")
  const body = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const customerId = session.customer as string
    const userId = session.metadata?.userId

    let profile
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      profile = data
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single()
      profile = data
    }

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          is_pro: true,
          credits_limit: 100,
          stripe_customer_id: customerId,
        })
        .eq("id", profile.id)
    }
  }

  // invoice.payment_succeeded
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any
    const customerId = invoice.customer as string

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .single()

    if (profile) {
      // Opción A: resetear créditos cada mes
      await supabase
        .from("profiles")
        .update({
          credits_used: 0,
          is_pro: true,
        })
        .eq("id", profile.id)
    }
  }

  // customer.subscription.deleted
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any
    const customerId = subscription.customer as string

    await supabase
      .from("profiles")
      .update({
        is_pro: false,
        credits_limit: 5,
      })
      .eq("stripe_customer_id", customerId)
  }

  // customer.subscription.updated
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any
    const customerId = subscription.customer as string
    const status = subscription.status

    if (status === "active") {
      await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("stripe_customer_id", customerId)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

---

#### 5.3 `create-portal-session` (Customer Portal)

Permite que usuarios PRO gestionen su suscripción:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "")

serve(async (req) => {
  try {
    const { userId } = await req.json()

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No customer found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${Deno.env.get("SITE_URL")}/`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
```

---

### 6. Frontend – Integración en React

#### 6.1 `lib/stripeClient.ts` (opcional)

Solo necesario si quieres usar Stripe.js/Elements:

```typescript
import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
```

#### 6.2 `UserMenu.tsx`

Lógica recomendada:
- Si `!profile.is_pro` → botón **"Mejorar a PRO"** llama a `create-checkout-session`.
- Si `profile.is_pro` → botón **"Gestionar Suscripción"** llama a `create-portal-session`.

Pseudo-código:

```typescript
import { supabase } from '../lib/supabaseClient'

// Dentro de UserMenu
{!profile.is_pro ? (
  <button
    onClick={async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { userId: user.id }
        })
        if (error) throw error
        if (data?.url) window.location.href = data.url
      } catch (err) {
        console.error(err)
        alert('Error al iniciar checkout')
      } finally {
        setLoading(false)
      }
    }}
  >
    Mejorar a PRO
  </button>
) : (
  <button
    onClick={async () => {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: user.id }
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    }}
  >
    Gestionar Suscripción
  </button>
)}
```

#### 6.3 Manejo de `success` / `cancel` en `App.tsx`

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const success = params.get('success')
  const canceled = params.get('canceled')

  if (success) {
    // Opcional: mostrar toast de éxito
    refreshProfile() // Recargar perfil desde Supabase
    window.history.replaceState({}, '', '/')
  }

  if (canceled) {
    // Opcional: mostrar mensaje de cancelación
    window.history.replaceState({}, '', '/')
  }
}, [])
```

---

### 7. Variables de Entorno Necesarias

#### Frontend (`.env.local`)

- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` *(tu clave pública de Stripe - puedes obtenerla en Stripe Dashboard)*
- `VITE_STRIPE_PRICE_ID_PRO=price_1SjzGJQ1D8R8cAWW3lBavRbc`
- `GEMINI_API_KEY=...` *(ya usada para Gemini)*

#### Supabase – Edge Functions (Secrets)

- `STRIPE_SECRET_KEY=sk_test_...` *(tu clave secreta de Stripe - NUNCA la compartas públicamente)*
- `STRIPE_PRICE_ID_PRO=price_1SjzGJQ1D8R8cAWW3lBavRbc`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `SITE_URL=https://tudominio.com` (o `http://localhost:3000` en local)
- `SUPABASE_URL=https://...supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...` *(service role, solo en backend, nunca en frontend)*

---

### 8. Checklist Rápido

**Backend**
- [ ] Crear/ajustar tabla `profiles` con campos de Stripe/créditos
- [ ] Implementar `create-checkout-session`
- [ ] Implementar `stripe-webhook`
- [ ] Implementar `create-portal-session`
- [ ] Configurar secrets en Supabase

**Stripe Dashboard**
- [ ] Crear producto y precio de suscripción PRO
- [ ] Configurar webhook hacia `/functions/v1/stripe-webhook`
- [ ] Copiar `STRIPE_WEBHOOK_SECRET` a Supabase

**Frontend**
- [ ] Añadir lógica de checkout/portal en `UserMenu.tsx`
- [ ] (Opcional) Configurar `stripePromise` en `lib/stripeClient.ts`
- [ ] Manejar `success` / `canceled` en `App.tsx`

**Testing**
- [ ] Probar compra con tarjeta de test `4242 4242 4242 4242`
- [ ] Verificar que `is_pro` y `credits_limit` se actualizan
- [ ] Verificar que el webhook se recibe correctamente
- [ ] Probar cancelación y Customer Portal

---

### 9. Cosas que AÚN FALTAN / Debes decidir tú

- **Claves reales de Stripe**:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`
- **Producto y precio concretos en Stripe**:
  - ID real de `STRIPE_PRICE_ID_PRO`
- **Dominio final de la app**:
  - Valor definitivo de `SITE_URL`
- **Política exacta de créditos**:
  - ¿Cuántos créditos tiene el plan PRO? (ej: `credits_limit = 100`)
  - ¿Se resetea `credits_used` en cada renovación mensual? (recomendado: sí)
- **Modelo de precios**:
  - ¿Un único plan PRO o varios (Basic/Pro/Enterprise)?  

En cuanto tengas estos valores/decisiones, puedo ayudarte a ajustar el código y los ejemplos para que coincidan exactamente con tu configuración real.


