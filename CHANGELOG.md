# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org).


## [0.1.1] - 2026-05-14

### Changed
- Refactored `wave:prompt` to clarify that the AI API only generates optimized prompts for Copilot, never code.
- Updated all documentation (README, GUIDE, doctor, CLI help) to explain the new prompt optimization flow and Copilot's role.

### Added
- `init` command — interactive project initialization with full .r2pde-ai structure
- `doctor` command — environment health check
- `manifest:create` / `manifest:delete` — manifest artifact management
- `contract:create` / `contract:delete` — contract artifact management
- `requirement:create` / `requirement:delete` — requirement artifact management
- `score` / `score:config` — quality score engine with traffic light system
- `wave:prompt` — consolidated AI copilot prompt generation per wave
- `config:set` / `config:lang` — configuration management
- `reset` — prompts folder cleanup
- `logs` / `logs --clear` — audit log management
- Automated tests with Vitest (14 tests, 100% pass)
- Enhanced --help with examples and documentation
