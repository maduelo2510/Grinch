# SignalFinder.ai - Documentación del Proyecto

## 📋 Resumen del Proyecto

**SignalFinder.ai** es un dashboard de inteligencia de negocios que ayuda a encontrar oportunidades de mercado validadas mediante el análisis de señales de problemas en comunidades online (Reddit, Hacker News, IndieHackers).

### ¿Qué hace el proyecto?

El proyecto permite a los usuarios:
1. **Buscar oportunidades de negocio** ingresando un tema de interés
2. **Generar consultas optimizadas** usando IA (Gemini) para buscar en diferentes plataformas
3. **Analizar señales de problemas** detectando puntos de dolor, frecuencia, solucionabilidad y monetización
4. **Obtener oportunidades validadas** clasificadas por "Signal Score" con métricas detalladas

### Flujo Principal

1. Usuario ingresa un tema (ej: "gestión de proyectos")
2. El sistema genera consultas optimizadas para Reddit, HN e IndieHackers usando Gemini
3. Simula/ejecuta búsquedas en estas plataformas (actualmente simulado, preparado para Firecrawl)
4. Analiza los resultados con Gemini para extraer problemas y oportunidades
5. Muestra problemas ordenados por Signal Score con métricas detalladas
6. Descuenta créditos del usuario tras cada búsqueda

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS (clases utilitarias)
- **Backend/Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **IA**: Google Gemini (gemini-3-flash-preview)
- **API de Crawling**: Firecrawl (mencionado, preparado para integración)

## 📁 Estructura del Proyecto

```
Grinch/
├── App.tsx                    # Componente principal, maneja búsquedas y estado
├── components/
│   ├── AnalysisProgress.tsx   # Muestra progreso del análisis
│   ├── AuthModal.tsx          # Modal de login/registro
│   ├── ProblemCard.tsx        # Tarjeta de problema/oportunidad
│   ├── ProblemDetail.tsx      # Detalle expandido de problema
│   ├── SearchInput.tsx        # Input de búsqueda
│   ├── SignalMatrix.tsx       # Matriz de señales
│   └── UserMenu.tsx           # Menú de usuario con créditos
├── context/
│   └── AuthContext.tsx        # Contexto de autenticación y perfil
├── lib/
│   └── supabaseClient.ts      # Cliente de Supabase
├── services/
│   └── geminiService.ts       # Servicios de IA (generación de queries y análisis)
├── types.ts                   # Tipos TypeScript
└── package.json
```

## 🔑 Conceptos Clave

### Sistema de Créditos
- Usuarios tienen un límite de créditos (default: 5 para usuarios free)
- Cada búsqueda consume 1 crédito (se incrementa `credits_used` vía RPC `increment_credits`)
- La lógica de consumo está implementada en `App.tsx` → `handleSearch()` → línea 105
- Visualización: `UserMenu.tsx` calcula `creditsLeft = limit - used` y muestra en navbar
- Fallback en frontend: `AuthContext.tsx` asigna 5 créditos si no hay datos en DB (línea 56)
- Usuarios PRO tendrán `credits_limit` aumentado (ej: 100 o ilimitado)
- **Consideración importante**: Al renovar suscripción mensual, decidir si resetear `credits_used` a 0 o mantener límite alto

### Perfil de Usuario
- Almacenado en tabla `profiles` de Supabase vinculada a `auth.users`
- La interfaz TypeScript `UserProfile` en `types.ts` ya está completamente preparada:
  ```typescript
  export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    credits_used: number;         // Contador de uso actual
    credits_limit?: number;        // Límite máximo (Free: 5, Pro: 100+)
    is_pro: boolean;               // Estado de la suscripción
    stripe_customer_id?: string;   // Vinculación con Stripe (preparado)
  }
  ```
- Todos los campos necesarios ya existen en la estructura de tipos

### Análisis de Problemas
Cada problema detectado incluye:
- **Pain Intensity** (0-10): Intensidad del dolor
- **Frequency** (0-10): Frecuencia del problema
- **Solvability** (0-10): Facilidad de solución técnica
- **Monetizability** (0-10): Capacidad de pago de la audiencia
- **Signal Score** (0-10): Puntuación general ponderada
- **Solution Opportunity**: Recomendación de producto
- **Competitors**: Competidores actuales y sus gaps
- **Key Quotes**: Citas relevantes de usuarios
- **Sources**: Fuentes (Reddit, HN, IndieHackers)

## 🔌 Integración con Stripe - Guía Paso a Paso

### ⚠️ Estado Actual de la Integración

**Lo que YA está preparado:**
- ✅ Estructura de base de datos (`profiles` con campos necesarios)
- ✅ Tipo TypeScript `UserProfile` con `stripe_customer_id` y `is_pro`
- ✅ Botón "Mejorar a PRO" en `UserMenu.tsx` (línea 82-89) - **existe pero no funciona**
- ✅ Sistema de créditos funcional con RPC `increment_credits`
- ✅ Visualización de créditos en navbar y menú de usuario

**Lo que FALTA implementar:**
- ❌ Edge Functions de Supabase para Stripe
- ❌ Lógica del botón "Mejorar a PRO" (invocar checkout)
- ❌ Webhook handler para eventos de Stripe
- ❌ Customer Portal para gestión de suscripción (cuando `is_pro = true`)
- ❌ Manejo de página de éxito/cancelación

### Paso 1: Instalar Stripe en el Proyecto

```bash
npm install @stripe/stripe-js
```

### Paso 2: Configurar Variables de Entorno

Añade a tu archivo `.env.local`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Tu clave pública de Stripe (obtenerla en Stripe Dashboard)
VITE_STRIPE_PRICE_ID_PRO=price_1SjzGJQ1D8R8cAWW3lBavRbc  # ID del precio de suscripción PRO
```

### Paso 3: Crear Servicio de Stripe (Frontend)

Crea `lib/stripeClient.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### Paso 4: Crear Edge Function `create-checkout-session`

**IMPORTANTE**: Esta función debe ejecutarse server-side en Supabase Edge Functions para mantener seguras las claves privadas de Stripe.

**Requisitos de la función:**
1. Recibe `user_id` y opcionalmente `price_id` (Stripe)
2. Crea o recupera el `stripe_customer_id` del usuario desde la tabla `profiles`
3. Si no existe customer en Stripe, lo crea y guarda el ID en `profiles.stripe_customer_id`
4. Genera una sesión de Stripe Checkout
5. Devuelve la URL de redirección al frontend

Crea `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

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
    
    // Inicializar Supabase client con service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener perfil del usuario
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
    
    // Crear o recuperar customer en Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({ 
        email: profile.email,
        metadata: { supabase_user_id: userId }
      })
      customerId = customer.id
      
      // Guardar customer_id en profiles
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
    }
    
    // Usar priceId del request o el de env
    const finalPriceId = priceId || Deno.env.get("STRIPE_PRICE_ID_PRO")
    
    // Crear checkout session
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
      metadata: {
        userId: userId
      }
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

### Paso 5: Crear Edge Function `stripe-webhook`

**IMPORTANTE**: Esta función debe ser pública (sin autenticación) para recibir eventos de Stripe.

**Eventos a manejar:**
- `checkout.session.completed`: Cuando el pago se completa exitosamente
- `invoice.payment_succeeded`: Cuando se renueva la suscripción mensual
- `customer.subscription.deleted`: Cuando se cancela la suscripción
- `customer.subscription.updated`: Cuando se actualiza la suscripción

**Acciones requeridas:**
1. Actualizar `is_pro = true` en la tabla `profiles`
2. Aumentar `credits_limit` (ej: a 100 o ilimitado)
3. Guardar `stripe_customer_id` si no existe
4. **Decisión de diseño**: Al renovar suscripción (`invoice.payment_succeeded`), decidir si resetear `credits_used` a 0 o mantener límite alto

Crea `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "")
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
)

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
  
  // Manejar checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const customerId = session.customer as string
    const userId = session.metadata?.userId
    
    // Buscar usuario por stripe_customer_id o userId del metadata
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
      // Actualizar a PRO
      await supabase
        .from("profiles")
        .update({ 
          is_pro: true,
          credits_limit: 100, // Ajustar según tu modelo de negocio
          stripe_customer_id: customerId // Asegurar que esté guardado
        })
        .eq("id", profile.id)
    }
  }
  
  // Manejar renovación de suscripción mensual
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object
    const customerId = invoice.customer as string
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("stripe_customer_id", customerId)
      .single()
    
    if (profile) {
      // OPCIÓN A: Resetear créditos usados cada mes
      await supabase
        .from("profiles")
        .update({ 
          credits_used: 0, // Resetear contador
          is_pro: true // Asegurar que sigue siendo PRO
        })
        .eq("id", profile.id)
      
      // OPCIÓN B: Solo mantener límite alto (sin resetear)
      // await supabase
      //   .from("profiles")
      //   .update({ is_pro: true })
      //   .eq("id", profile.id)
    }
  }
  
  // Manejar cancelación de suscripción
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object
    const customerId = subscription.customer as string
    
    await supabase
      .from("profiles")
      .update({ 
        is_pro: false,
        credits_limit: 5 // Volver a límite free
      })
      .eq("stripe_customer_id", customerId)
  }
  
  // Manejar actualización de suscripción
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object
    const customerId = subscription.customer as string
    const status = subscription.status
    
    // Si la suscripción está activa, asegurar que is_pro = true
    if (status === "active") {
      await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("stripe_customer_id", customerId)
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

### Paso 6: Verificar Base de Datos (Supabase)

**NOTA**: La estructura de la tabla `profiles` ya debería estar preparada según el contexto. Verifica que tenga:

- `stripe_customer_id` (TEXT, nullable)
- `is_pro` (BOOLEAN, default false)
- `credits_limit` (INTEGER, default 5)
- `credits_used` (INTEGER, default 0)

Si falta algún campo, ejecuta en SQL Editor de Supabase:

```sql
-- Verificar estructura actual
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Añadir campos si no existen
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
```

### Paso 7: Actualizar `components/UserMenu.tsx` para Checkout

**IMPORTANTE**: El botón "Mejorar a PRO" ya existe en `UserMenu.tsx` (líneas 82-89) pero actualmente no hace nada. Necesitas:

1. **Si el usuario NO es PRO**: Mostrar botón que invoque `create-checkout-session` y redirija a Stripe
2. **Si el usuario ES PRO**: Mostrar botón "Gestionar Suscripción" que abra el Stripe Customer Portal

**Opción A: Crear componente separado** `components/StripeCheckout.tsx`:

```typescript
import React, { useState } from 'react';
import { stripePromise } from '../lib/stripeClient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const StripeCheckout: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();

  const handleCheckout = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Llamar a tu Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { userId: user.id, userEmail: user.email }
      });
      
      if (error) throw error;
      
      // Redirigir a Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al iniciar checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
    >
      {loading ? 'Cargando...' : 'Mejorar a PRO'}
    </button>
  );
};

export default StripeCheckout;
```

### Paso 8: Integrar en UserMenu y Añadir Customer Portal

**Actualizar `components/UserMenu.tsx`:**

Reemplaza el botón existente (líneas 82-89) con lógica completa:

```typescript
// Importar al inicio del archivo
import { supabase } from '../lib/supabaseClient';

// Dentro del componente UserMenu, reemplazar el botón:
{!profile.is_pro ? (
  <button 
    onClick={async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { userId: user.id }
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
      } catch (err) {
        console.error('Error:', err);
        alert('Error al iniciar checkout');
      } finally {
        setLoading(false);
      }
    }}
    className="w-full text-left px-5 py-2.5 text-sm text-emerald-400 hover:bg-slate-800 transition-colors font-bold flex items-center"
  >
    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    Mejorar a PRO
  </button>
) : (
  <button 
    onClick={async () => {
      // Crear sesión de Customer Portal
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { userId: user.id }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    }}
    className="w-full text-left px-5 py-2.5 text-sm text-indigo-400 hover:bg-slate-800 transition-colors font-bold flex items-center"
  >
    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    Gestionar Suscripción
  </button>
)}
```

**Crear Edge Function adicional para Customer Portal** `supabase/functions/create-portal-session/index.ts`:

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

### Paso 9: Crear Página de Éxito

Crea una ruta/página para manejar el retorno de Stripe:

```typescript
// En App.tsx o tu router
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    // Verificar sesión y actualizar perfil
    refreshProfile();
    // Limpiar URL
    window.history.replaceState({}, '', '/');
  }
}, []);
```

### Paso 10: Configurar Webhook en Stripe Dashboard

1. Ve a Stripe Dashboard → Developers → Webhooks
2. Añade endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copia el "Signing secret" y añádelo a variables de entorno de Supabase como `STRIPE_WEBHOOK_SECRET`

### Paso 11: Configurar Variables de Entorno en Supabase

En Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- `STRIPE_SECRET_KEY`: `sk_test_...` *(tu clave secreta de Stripe - NUNCA la compartas públicamente)*
- `STRIPE_PRICE_ID_PRO`: ID del precio de suscripción
- `STRIPE_WEBHOOK_SECRET`: Secret del webhook
- `SITE_URL`: URL de tu aplicación (ej: `https://tudominio.com`)

### Paso 12: Desplegar Edge Functions

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref tu-project-ref

# Desplegar funciones
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## ✅ Checklist de Integración

### Backend (Supabase Edge Functions)
- [ ] Instalar Supabase CLI (`npm install -g supabase`)
- [ ] Crear Edge Function `create-checkout-session`
- [ ] Crear Edge Function `stripe-webhook`
- [ ] Crear Edge Function `create-portal-session` (para gestión de suscripción)
- [ ] Verificar/actualizar tabla `profiles` con campos necesarios
- [ ] Configurar variables de entorno en Supabase (STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO, STRIPE_WEBHOOK_SECRET, SITE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Desplegar todas las Edge Functions

### Frontend
- [ ] Instalar `@stripe/stripe-js` (opcional, solo si usas Stripe Elements)
- [ ] Crear `lib/stripeClient.ts` (si usas Stripe.js)
- [ ] Actualizar `components/UserMenu.tsx` con lógica de checkout
- [ ] Añadir manejo de página de éxito/cancelación en `App.tsx`
- [ ] Probar flujo de checkout completo (modo test)

### Stripe Dashboard
- [ ] Crear producto y precio de suscripción PRO en Stripe
- [ ] Configurar webhook endpoint: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`
- [ ] Seleccionar eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] Copiar webhook signing secret y añadirlo a Supabase secrets

### Testing
- [ ] Probar checkout con tarjeta de prueba (`4242 4242 4242 4242`)
- [ ] Verificar que `is_pro` se actualiza correctamente
- [ ] Verificar que `credits_limit` aumenta
- [ ] Probar cancelación de suscripción
- [ ] Probar Customer Portal
- [ ] Verificar webhook events en Stripe Dashboard

## 🔒 Seguridad

- **NUNCA** expongas `STRIPE_SECRET_KEY` en el frontend
- Usa Edge Functions o backend para operaciones sensibles
- Valida webhooks con el signing secret
- Usa variables de entorno para todas las claves

## 📝 Notas Adicionales

### Estado Actual del Proyecto
- El proyecto actualmente **simula las búsquedas** (delays artificiales en `App.tsx` líneas 81-86)
- Firecrawl está mencionado pero **no implementado aún** - las búsquedas son simuladas
- El sistema de créditos está **funcional** con Supabase RPC `increment_credits`
- La integración de Stripe permitirá monetizar el acceso PRO

### Archivos Clave a Modificar

1. **`types.ts`**: ✅ Ya está preparado, no requiere cambios
2. **`components/UserMenu.tsx`**: ⚠️ Requiere actualización del botón "Mejorar a PRO" (líneas 82-89)
3. **`lib/supabaseClient.ts`**: ✅ Ya existe, se usará para `supabase.functions.invoke()`
4. **`App.tsx`**: ⚠️ Añadir manejo de parámetros de URL para éxito/cancelación

### Decisiones de Diseño Pendientes

1. **Persistencia de créditos al renovar suscripción**:
   - Opción A: Resetear `credits_used = 0` cada mes (renovación)
   - Opción B: Mantener límite alto sin resetear (acumulativo)
   - **Recomendación**: Opción A para modelo SaaS recurrente

2. **Límite de créditos PRO**:
   - ¿100 créditos/mes?
   - ¿Ilimitado?
   - ¿Diferentes planes (Basic/Pro/Enterprise)?

3. **Precio de suscripción**:
   - Definir en Stripe Dashboard antes de desplegar

### Limitaciones y Reglas de Seguridad

- ⚠️ **NUNCA** usar `stripe-node` o claves secretas (`sk_live_...`) directamente en el cliente React
- ✅ Todo procesamiento de pago debe pasar por Supabase Edge Functions
- ✅ Validar webhooks con el signing secret para prevenir ataques
- ✅ Usar variables de entorno para todas las claves sensibles
- ✅ El webhook debe ser público pero validado con signature

---

**Última actualización**: Integrado contexto adicional del modelo anterior

