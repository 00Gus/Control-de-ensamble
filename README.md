# 🏭 Control de Ensamble de Varillas

Una Aplicación Web Progresiva (PWA) moderna y rápida diseñada para gestionar el conteo de ensamblaje de varillas, control de inventario y cierres semanales. 

![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n-success)
![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-orange)

## ✨ Características Principales

* **🚀 Rápida e Instalable:** Funciona como una aplicación nativa en el celular. Puedes instalarla directamente desde el navegador agregándola a tu pantalla de inicio.
* **📱 Diseño "Premium":** Interfaz moderna estilo iOS con modo oscuro inteligente, botones amplios para uso rudo, sombras suaves y un flujo de usuario amigable.
* **☁️ Sincronización en la Nube:** Conectada en tiempo real a Google Sheets mediante Google Apps Script. Todos los registros están respaldados en la nube.
* **📴 Modo Offline-First:** Si pierdes la conexión a internet, la app sigue funcionando y guardará tus datos de forma local hasta que te reconectes.
* **✏️ Edición Inteligente:** ¿Te equivocaste? Puedes editar registros anteriores desde el historial y el sistema actualizará automáticamente la base de datos en la nube.
* **🔐 Cierres Semanales Seguros:** Sistema automatizado que emite reportes CSV físicos al teléfono y archiva todo el historial de la semana en una pestaña segura en Google Sheets, dejando todo limpio para el día lunes.
* **🔒 Acceso Protegido:** Bloqueada por un PIN de seguridad para que solo los administradores puedan registrar y modificar los conteos.

## 🛠️ Tecnologías Utilizadas

* **HTML5, CSS3, JavaScript (Vanilla):** Lógica rápida y sin dependencias pesadas.
* **Service Workers:** Para la caché y funcionalidad offline.
* **Google Apps Script:** Como backend serverless y base de datos maestra en Google Sheets.
* **Fetch API:** Para comunicación asíncrona segura (con manejo de CORS evasivo).

## 💡 Cómo Usar la Aplicación

1. **Inicia Sesión:** Ingresa tu PIN de administrador.
2. **Registra Piezas:** Selecciona al trabajador en las tarjetas superiores e ingresa la cantidad de piezas ensambadas.
3. **Corrige Errores:** Usa el ícono ✏️ en el Historial para modificar la cantidad si hubo un error.
4. **Cierre Semanal:** El sábado por la tarde, presiona el botón rojo de "Cierre Semanal". Se descargará un Excel a tu celular y la nube archivará todo, reiniciando la semana a cero.

## 📥 Despliegue en GitHub Pages

Este proyecto está configurado para desplegarse fácilmente a través de GitHub Pages, haciendo que su acceso mediante URL sea gratuito e instantáneo para todo el equipo.

---
*Diseñado y programado para control de producción y ensamblaje.*
