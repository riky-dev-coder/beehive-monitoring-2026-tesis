# 🔐 Autenticación con Supabase - Setup

## 📋 Paso 1: Configurar Variables de Entorno

Edita el archivo `.env.local` en la carpeta `frontend/` y reemplaza los siguientes valores:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```

## 🔑 Paso 2: Obtener Credenciales de Supabase

1. Ve a [Supabase Console](https://app.supabase.com/)
2. Selecciona tu proyecto de Beehive Monitoring
3. En el menú lateral izquierdo, ve a **Settings** → **API**
4. Copia:
   - **Project URL** → Pégalo en `VITE_SUPABASE_URL`
   - **anon public key** (key) → Pégalo en `VITE_SUPABASE_KEY`

## 📊 Paso 3: Verificar Tabla de Usuarios (Opcional)

Si deseas guardar datos adicionales de usuarios en Supabase:

1. Ve a **SQL Editor** en la Supabase Console
2. Ejecuta la siguiente consulta para crear una tabla `users` (opcional):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## ✅ Paso 4: Probar Autenticación

1. Guarda los cambios en `.env.local`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Deberías ver la página de login
4. Prueba con:
   - **Crear cuenta**: Ingresa un email y contraseña válidos
   - **Iniciar sesión**: Usa las credenciales que acabas de crear
   - **Cerrar sesión**: Haz clic en tu email en la esquina superior derecha

## 🔒 Características Actuales

- ✅ Registro de nuevos usuarios
- ✅ Inicio de sesión con email/password
- ✅ Sesión NO persistente (se cierra al recargar)
- ✅ Interfaz de usuario consistente con el diseño del proyecto
- ✅ Logout desde el perfil de usuario
- ✅ Manejo de errores de autenticación

## 📝 Notas

- Las sesiones NO se guardan en localStorage (se pierden al recargar la página)
- El backend aún no valida tokens de Supabase (validación solo en frontend)
- Asegúrate de que el email confirmado esté habilitado en tu proyecto Supabase si quieres email verification

## 🐛 Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
- Solución: Ejecuta `npm install` en la carpeta `frontend/`

**Error: "VITE_SUPABASE_URL is empty"**
- Solución: Verifica que `.env.local` existe y tiene los valores correctos

**Login no funciona**
- Verifica que tu proyecto de Supabase está activo
- Revisa que las credenciales en `.env.local` son correctas

---

¡Listo! Tu autenticación con Supabase está configurada. 🚀
