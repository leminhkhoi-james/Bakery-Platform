Review the code changes in this PR. Check every item below — flag violations clearly.

## Architecture
- [ ] Controller only receives request → calls service → returns response (no business logic)
- [ ] Service uses Interface + Impl pattern
- [ ] Controller injects interface, NOT implementation class
- [ ] No HTTP concerns in service layer (no HttpServletRequest, ResponseEntity, HttpStatus)
- [ ] Entity → DTO conversion happens in service layer, not controller

## Type Safety & DTOs
- [ ] All request/response use Java Records (not Entity)
- [ ] Entity is NEVER returned directly from controller
- [ ] Request DTOs have Jakarta Validation annotations (@NotBlank, @Email, @Size, etc.)
- [ ] Response DTOs have `static fromEntity()` method
- [ ] No sensitive fields (password, token) in response DTOs

## Dependency Injection
- [ ] Constructor injection only — NO `@Autowired` on fields
- [ ] All dependencies are `private final`
- [ ] Explicit constructor written (not relying on Lombok)

## Error Handling
- [ ] Custom exceptions used (not raw RuntimeException)
- [ ] All custom exceptions extend AppException
- [ ] Controller does NOT have try/catch — GlobalExceptionHandler handles it
- [ ] 404 cases throw ResourceNotFoundException
- [ ] Duplicate/conflict cases throw InvalidRequestException

## Security
- [ ] No hardcoded secrets or config values
- [ ] Password never logged or returned in response
- [ ] JWT claims don't contain sensitive data
- [ ] New endpoints have proper authorization check
- [ ] Public endpoints are explicitly listed in SecurityConfig

## JPA & Database
- [ ] `FetchType.LAZY` on all relationships
- [ ] `@Enumerated(EnumType.STRING)` — never ORDINAL
- [ ] `@Transactional` on service methods that write data
- [ ] Repository returns `Optional<T>` for single results
- [ ] No N+1 query problems (check if LAZY fetch triggers in loop)
- [ ] Explicit `@Column` constraints (nullable, length, unique)

## Code Quality
- [ ] File < 300 lines
- [ ] Method < 50 lines
- [ ] No `@Data` on entities
- [ ] Logger: `private static final Logger log = LoggerFactory.getLogger(...)` (no Lombok)
- [ ] Log uses `{}` placeholders, not string concatenation
- [ ] No sensitive data in logs

## Convention
- [ ] Class naming follows .codex-rules/project-rules.md (Controller, Service, ServiceImpl, Repository, etc.)
- [ ] Method naming follows convention (controller: HTTP verb, service: business action)
- [ ] Variables are camelCase, constants are UPPER_SNAKE_CASE
- [ ] Feature package structure: controller + service + serviceImpl + repository + entity + dto/

## Documentation
- [ ] If new feature: CONTEXT.md created inside feature package
- [ ] If logic changed: CONTEXT.md updated (add Refactor Log entry, don't overwrite)
- [ ] If new endpoint: docs/API_SPEC.md updated
- [ ] If schema changed: docs/DATABASE.md updated

## Summary
After checking, provide:
1. **Blockers** — must fix before merge
2. **Suggestions** — improve but not blocking
3. **Good parts** — what was done well