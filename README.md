# 📬 MailCampaing

**MailCampaing** es una plataforma de email marketing pensada para pequeñas y medianas organizaciones que desean crear, enviar y medir campañas de correo de forma simple y escalable.

Permite diseñar campañas personalizadas con templates HTML, agrupar contactos, realizar envíos masivos mediante Amazon SES y hacer seguimiento de aperturas, rebotes y clics. Todo desde una interfaz clara y funcional, con backend **serverless construido sobre AWS Lambda**.

---

## 🚀 Características principales

- **Autenticación segura** con email y contraseña.
- **Dashboard** con campañas activas, pasadas y estadísticas.
- **Creación de campañas** con selección de template y grupo de usuarios.
- **Gestión de templates HTML** editables y reutilizables.
- **Carga de grupos de usuarios** mediante emails manuales o archivos CSV.
- **Integración con Amazon SES** para envíos.
- **Tracking avanzado** de:
  - Emails enviados
  - Rebotes
  - Aperturas (tracking pixel)
  - Clics (enlaces con redireccionador)
- **Métricas por campaña** con análisis visual.

---

## 🧱 Tecnologías utilizadas

| Parte            | Tecnología                      |
|------------------|----------------------------------|
| Frontend         | Next.js, React, TailwindCSS      |
| Backend (API)    | Node.js (AWS Lambda)             |
| Base de datos    | PostgreSQL + Prisma ORM          |
| Email            | Amazon SES                       |
| Tracking         | AWS Lambda + API Gateway         |
| Infraestructura  | AWS CDK (TypeScript)             |

---

## 📦 Estructura general (en desarrollo)

