# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email us at [security@example.com](mailto:security@example.com)** with details about the vulnerability
3. Include the following information:
   - Type of vulnerability
   - Full path to the vulnerable file(s)
   - Steps to reproduce
   - Potential impact

## Security Measures

This project implements the following security measures:

- Regular dependency updates via Dependabot
- Security scanning with Snyk and npm audit
- Helmet.js for securing Express.js applications
- Content Security Policy (CSP) headers
- HTTPS enforcement
- Input validation with Zod
- Proper error handling to prevent information leakage

## Security Update Process

1. Security vulnerabilities are assessed within 48 hours of reporting
2. Critical vulnerabilities are patched as soon as possible
3. Security updates are released as patch versions
4. Security advisories are published for fixed vulnerabilities

## Security Best Practices for Contributors

- Keep dependencies up to date
- Follow secure coding practices
- Use parameterized queries for database operations
- Validate all user inputs
- Implement proper authentication and authorization
- Use environment variables for sensitive information
- Never commit secrets or credentials to the repository
