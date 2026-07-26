# Security Policy

## Overview

This repository welcomes responsible security reports from developers, researchers, and automated systems. Our goal is to keep the project safe by fixing issues quickly while making reporting clear and actionable.

We treat security reports from humans and LLM-assisted tools the same: if you discover a vulnerability, please share it through the channels below with enough detail to reproduce it safely.

## Supported Versions

We support the following versions with security updates:

| Version         | Supported          |
| --------------- | ------------------ |
| `main` / latest | :white_check_mark: |
| `v1.x`          | :white_check_mark: |
| Older branches  | :x:                |

If you are unsure whether your version is supported, open an issue or contact us directly.

## What to Report

Please report security issues such as:

- Smart contract vulnerabilities (reentrancy, integer overflow/underflow, access control bugs, unsafe delegatecalls, token/ether lockups, etc.)
- API or backend issues that expose secrets, private data, or administrative actions
- Supply-chain issues in build tooling, dependencies, or deployment scripts
- Misconfigured access controls, unsafe default settings, or insecure file permissions
- Any other finding that can lead to unauthorized access, data loss, or fund loss

Do not report general bugs, feature requests, or usage questions as security issues.

## What to Include

A good security report should include:

- A clear summary of the issue
- Affected component(s) and version or branch
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Any PoC code, test case, or transaction trace that demonstrates the issue
- Impact assessment (e.g. data exposure, loss of funds, unauthorized actions)

If your report is generated or assisted by an LLM, please note that clearly.

## Reporting Process

Contact us through one of these channels:

1. Open an issue in this repository with the label `security` if your report is not sensitive.

If applicable, include a suggested CVE candidate and the steps needed to validate the issue.

## Response Timeline

We aim to acknowledge all reports within 3 business days and provide a status update within 7 business days.

If we need more time, we will communicate the delay and expected timeline.

## Safe Disclosure

Please do not publish security issues publicly until they have been fixed or you have received permission from the project maintainers.

Responsible disclosure helps protect users while giving the team time to remediate.

## Liability and Scope

This policy covers only this repository and its direct dependencies. It does not authorize actions against third-party services, infrastructure, or unrelated software.

Do not attempt intrusive testing that could harm production systems, infrastructure, or user data outside the scope of this project.

## Responsible Research Guidelines

- Prefer non-destructive proof-of-concept examples.
- Limit testing to your own accounts and test environments when possible.
- Avoid using production systems for exploit verification unless explicitly authorized.
- If you use automation or an LLM to generate findings, verify the output before submission.

## Contact and Follow-up

If you do not receive a response in the stated timeline, follow up through the same channel or open a new issue referencing the prior report.

Thank you for helping keep this project secure.
