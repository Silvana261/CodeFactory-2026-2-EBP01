1. Módulo de Autenticación (Auth)
Maneja el inicio de sesión y la verificación de credenciales de los usuarios en el sistema.

Controladores (AuthController)
login(LoginRequest request)

Ruta: POST /api/auth/login

Descripción: Recibe las credenciales del usuario (email y password), las valida sintácticamente y procesa la autenticación.

Retorno: ResponseEntity<UserResponse> con código HTTP 200 OK si el inicio de sesión es exitoso.

Servicios (AuthService)
login(LoginRequest request)

Descripción: Contrato encubierto para verificar las credenciales recibidas en la petición, autenticar al usuario frente a la base de datos y retornar su información general.

2. Módulo de Reglas de Precio (PricingRule)
Permite la creación, consulta y filtrado de las reglas de negocio aplicables a la determinación de precios.

Controladores (PricingController)
createPricingRule(PricingRuleRequest request)

Ruta: POST /api/pricing-rules

Descripción: Registra una nueva regla de pricing validando los campos requeridos (nombre, variable de negocio, operador, valor de condición, tipo y valor de ajuste, estado y creador).

Retorno: ResponseEntity<PricingRuleResponse> con estado HTTP 201 Created.

getAllPricingRules()

Ruta: GET /api/pricing-rules

Descripción: Obtiene la lista completa de todas las reglas de precios registradas en el sistema.

Retorno: ResponseEntity<List<PricingRuleResponse>> con estado HTTP 200 OK.

getPricingRulesByStatus(StatusRule status)

Ruta: GET /api/pricing-rules/status/{status}

Descripción: Filtra las reglas de precios de acuerdo con su estado (por ejemplo, ACTIVE o INACTIVE).

Retorno: ResponseEntity<List<PricingRuleResponse>> con estado HTTP 200 OK.

Servicios (PricingRuleService)
createPricingRule(PricingRuleRequest request): Construye y persiste una nueva regla de precio a partir del DTO recibido.

getAllPricingRules(): Recupera todas las reglas de la base de datos y las transforma a DTOs de respuesta.

getPricingRulesByStatus(StatusRule status): Recupera las reglas filtradas por estado desde la base de datos.

Repositorios (PricingRuleRepository)
findByStatus(StatusRule status): Consulta personalizada derivada de Spring Data JPA para filtrar entidades PricingRule por su estado.

3. Módulo de Usuarios (User)
Gestiona el registro de usuarios en la plataforma y la consulta de la lista de usuarios.

Controladores (UserController)
registerUser(RegisterUserRequest request)

Ruta: POST /api/users/register

Descripción: Recibe la información requerida para registrar a un nuevo usuario (nombre, correo electrónico, contraseña y rol).

Retorno: ResponseEntity<UserResponse> con estado HTTP 201 Created.

getAllUsers()

Ruta: GET /api/users

Descripción: Retorna el listado completo de los usuarios registrados.

Retorno: ResponseEntity<List<UserResponse>> con estado HTTP 200 OK.

Servicios (UserService)
registerUser(RegisterUserRequest request): Aplica la lógica de negocio para la creación e inscripción de un nuevo usuario en el sistema.

getAllUsers(): Recupera todos los usuarios registrados y los proyecta a la vista DTO UserResponse.

Repositorios (UserRepository)
findByEmail(String email): Obtiene una entidad User encapsulada en un Optional buscando por la dirección de correo electrónico.

existsByEmail(String email): Retorna un valor booleano (true/false) para verificar si un correo electrónico ya está registrado (útil para validaciones previas al registro).