# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

The security and privacy of election data are critical. If you discover a vulnerability or potential attack vector:

1. Do **NOT** disclose the vulnerability publicly or open a public GitHub issue.
2. Please submit a private security advisory on GitHub or email the project maintainer directly.
3. Include detailed steps to reproduce the issue, along with any proof-of-concept scripts or headers.

## Security Practices in VoteVision AI
- In-memory rate limiting against Denial of Service attacks.
- Standard OWASP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`).
- Rigorous input sanitization and length limits on query endpoints.
- Avoidance of sensitive system paths or secrets in logs.
