Diseña un prototipo web de alta fidelidad para una plataforma interna de una aerolínea llamada "AirPricing", cuyo objetivo es gestionar un motor de pricing dinámico para los tiquetes de vuelo.

El sistema tendrá dos roles principales:
1. Administrador: responsable de gestionar los usuarios que tienen acceso a la plataforma.
2. Analista de Pricing: responsable de definir y gestionar las reglas de pricing dinámico.

El prototipo corresponde al Sprint 1 y debe cubrir exactamente estos tres flujos:

1. REGISTRO DE USUARIOS
2. INICIO DE SESIÓN
3. DEFINICIÓN DE REGLAS DE PRICING DINÁMICO

IMPORTANTE:
- Es una plataforma interna para usuarios autorizados de la aerolínea.
- No debe existir un registro público de usuarios.
- El registro de usuarios debe ser realizado por el Administrador.
- El Administrador registra usuarios con el rol de Analista de Pricing.
- No incluir registro mediante Google en este Sprint.
- No incluir funcionalidades que todavía no forman parte del Sprint 1, como reportes, historial de precios, cálculo automático del precio o gestión avanzada de vuelos.

ESTILO VISUAL:
Crear una interfaz profesional, moderna y limpia, relacionada con una aerolínea y tecnología.
Utilizar una apariencia de sistema empresarial/SaaS.
Priorizar claridad y facilidad de uso sobre elementos decorativos.
Utilizar una jerarquía visual consistente, tipografía legible, espaciado uniforme y componentes reutilizables.
Utilizar colores sobrios relacionados con el sector aeronáutico y tecnológico.
Crear un sistema visual consistente para botones, formularios, tarjetas, tablas, mensajes y navegación.

PANTALLA 1 — INICIO DE SESIÓN

Crear una pantalla de inicio de sesión para usuarios registrados.

Debe contener:
- Logo/nombre de la plataforma.
- Campo de correo electrónico.
- Campo de contraseña.
- Botón "Iniciar sesión".
- Enlace "¿Olvidaste tu contraseña?" como elemento visual, aunque el flujo de recuperación no se implemente en este Sprint.
- Mensaje de error para credenciales incorrectas.
- Indicaciones para campos obligatorios.
- Estado de botón deshabilitado cuando los campos requeridos estén incompletos.
- Estado de carga después de seleccionar "Iniciar sesión".
- Estado de inicio de sesión exitoso.

Cuando el inicio de sesión sea exitoso:
- Mostrar una confirmación breve.
- Redirigir al usuario a la interfaz correspondiente a su rol.

PANTALLA 2 — PANEL DEL ADMINISTRADOR

Después del inicio de sesión de un Administrador, mostrar un dashboard sencillo.

Debe incluir:
- Barra de navegación.
- Nombre del usuario.
- Indicador visual del rol "Administrador".
- Opción "Usuarios".
- Opción para registrar un nuevo usuario.
- Opción para cerrar sesión.

No agregar funcionalidades innecesarias.

PANTALLA 3 — REGISTRAR USUARIO

Crear el formulario que permite al Administrador registrar un nuevo usuario.

Debe contener:
- Título "Registrar usuario".
- Campo nombre completo.
- Campo correo electrónico.
- Campo contraseña inicial.
- Selector de rol.
- El selector debe permitir seleccionar "Analista de Pricing".
- Botón "Registrar usuario".
- Botón "Cancelar".

Crear los siguientes estados:
- Formulario vacío.
- Campos obligatorios.
- Error de correo electrónico inválido.
- Error cuando el correo ya está registrado.
- Error cuando la contraseña no cumple los requisitos.
- Estado de carga al registrar.
- Estado de registro exitoso.
- Estado de error general.

Después de registrar correctamente al usuario:
- Mostrar una confirmación clara.
- Mostrar los datos básicos del usuario creado.
- Permitir volver a la lista de usuarios.

PANTALLA 4 — GESTIÓN DE USUARIOS

Crear una vista sencilla para que el Administrador pueda visualizar los usuarios registrados.

Mostrar una tabla o lista con:
- Nombre.
- Correo electrónico.
- Rol.
- Estado.

Incluir un botón "Registrar usuario".

Esta pantalla sirve como punto de entrada para el flujo de registro.

PANTALLA 5 — PANEL DEL ANALISTA DE PRICING

Después del inicio de sesión de un Analista de Pricing, mostrar un dashboard sencillo.

Debe contener:
- Barra de navegación.
- Nombre del usuario.
- Indicador visual del rol "Analista de Pricing".
- Opción "Reglas de Pricing".
- Opción para crear una nueva regla.
- Opción para cerrar sesión.

El Analista no debe visualizar opciones exclusivas del Administrador, como la gestión de usuarios.

PANTALLA 6 — REGLAS DE PRICING

Crear una vista para consultar las reglas de pricing existentes.

Debe mostrar:
- Nombre de la regla.
- Variable utilizada.
- Condición.
- Ajuste de precio.
- Estado de la regla.

Incluir un botón "Crear regla".

PANTALLA 7 — DEFINIR REGLA DE PRICING DINÁMICO

Crear el formulario para que el Analista de Pricing pueda definir una nueva regla.

La regla debe estar compuesta por:

1. Nombre de la regla.
2. Variable de negocio.
3. Operador/condición.
4. Valor de la condición.
5. Tipo de ajuste.
6. Valor del ajuste.

Las variables disponibles inicialmente son:

- Demanda.
- Disponibilidad.
- Contexto temporal.

Ejemplos de configuración:

Ejemplo 1:
Variable: Demanda
Condición: Mayor o igual que
Valor: 80 %
Ajuste: Aumentar
Valor del ajuste: 15 %

Ejemplo 2:
Variable: Disponibilidad
Condición: Menor o igual que
Valor: 20 %
Ajuste: Aumentar
Valor del ajuste: 20 %

Ejemplo 3:
Variable: Contexto temporal
Condición: Menor o igual que
Valor: 7 días
Ajuste: Aumentar
Valor del ajuste: 10 %

El formulario debe permitir:
- Seleccionar una variable.
- Seleccionar un operador apropiado.
- Introducir el valor de la condición.
- Seleccionar si el precio aumenta o disminuye.
- Introducir el porcentaje del ajuste.
- Introducir el nombre de la regla.

Antes de guardar:
- Mostrar una sección de resumen de la regla.
- Ejemplo: "Si la demanda es mayor o igual al 80 %, aumentar el precio un 15 %."

Crear los siguientes estados:
- Formulario vacío.
- Campos obligatorios.
- Valores inválidos.
- Regla incompleta.
- Estado de carga.
- Confirmación de regla creada correctamente.
- Error al guardar.

PANTALLA 8 — CONFIRMACIÓN DE REGLA

Después de guardar correctamente:
- Mostrar un mensaje de éxito.
- Mostrar el resumen de la regla creada.
- Mostrar botones "Ver reglas" y "Crear otra regla".

NAVEGACIÓN:

Crear un prototipo navegable entre las pantallas.

Flujo Administrador:
Inicio de sesión → Dashboard Administrador → Usuarios → Registrar usuario → Confirmación → Usuarios.

Flujo Analista:
Inicio de sesión → Dashboard Analista → Reglas de Pricing → Crear regla → Resumen/Confirmación → Reglas de Pricing.

SEGURIDAD:
- Las contraseñas deben mostrarse como caracteres ocultos.
- No mostrar contraseñas en listas o tablas.
- Mostrar claramente cuándo una funcionalidad requiere permisos.
- El Administrador debe ser el único rol que pueda acceder a la gestión de usuarios.
- El Analista de Pricing no debe tener acceso visual a la gestión de usuarios.

ACCESIBILIDAD:
Diseñar considerando WCAG 2.2 nivel AA.
- Contraste suficiente entre texto y fondo.
- No utilizar únicamente el color para comunicar estados.
- Etiquetas claras para todos los campos.
- Mensajes de error comprensibles.
- Estados de foco visibles.
- Navegación coherente.
- Botones y controles claramente identificables.
- Tamaños de texto legibles.
- Los formularios deben poder comprenderse sin depender únicamente de elementos visuales.

RESPONSIVIDAD:
Crear una propuesta adaptable para escritorio y tablet.
Priorizar el diseño de escritorio porque se trata de una plataforma interna de gestión.

IMPORTANTE:
No diseñar solamente pantallas estáticas. Crear componentes reutilizables y mostrar los principales estados de interacción de los formularios.
El resultado debe parecer un prototipo académico-profesional listo para ser presentado al equipo y posteriormente utilizado como referencia para el desarrollo frontend.