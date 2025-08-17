# Claude Instructions: Mnemonic Security Audit

## Objective
Conduct a comprehensive security audit focused on mnemonic protection and potential attack vectors in this React Native wallet application.

## Context
You are auditing a cryptocurrency wallet that stores user mnemonics encrypted with PIN-based key derivation. The primary security concern is preventing mnemonic exposure through various attack vectors.

## Step-by-Step Instructions

### 1. Code Review and Analysis
First, examine the cryptographic implementations and storage mechanisms:

**Focus on these files:**
- `util/crypto.ts` - Core cryptographic functions
- `util/pin-security.ts` - PIN-based key derivation
- `util/secure-store.ts` - Secure storage patterns
- `hooks/use-secure-storage.ts` - Storage hooks
- `hooks/use-transaction-pin.ts` - PIN handling
- `util/reveal-controller.ts` - Mnemonic reveal logic
- `util/random.ts` - Random number generation
- `util/security-utils.ts` - Security utilities

**What to look for:**
- Mnemonic storage and encryption implementations
- PIN-based key derivation mechanisms
- Secure storage usage patterns
- Potential side-channel attacks
- Timing attack vulnerabilities
- Information leakage through logs

### 2. Threat Modeling
Analyze these attack categories systematically:

**Offline Attacks:**
- Brute force PIN with extracted ciphertext and salt
- Rainbow table attacks using static salt
- Dictionary attacks on weak PINs

**Online Attacks:**
- Automated PIN brute forcing
- UI overlay/phishing attacks
- Malware-based PIN harvesting
- Side-channel timing attacks

**Device Compromise:**
- Memory dump analysis
- Secure storage extraction
- Debug/runtime manipulation
- Backup file analysis

**Implementation Flaws:**
- Weak key derivation parameters
- Predictable randomness
- Information leakage through logs
- Insecure key storage patterns

### 3. Vulnerability Assessment
Rate each finding using these severity levels:
- **Critical**: Direct path to mnemonic compromise with minimal effort
- **High**: Practical path to compromise with moderate attacker capability
- **Medium**: Increases attack likelihood given additional conditions
- **Low**: Theoretical or requires powerful attacker but still improvable

**Assessment Criteria:**
- Ease of exploitation
- Required attacker capabilities
- Impact on user funds
- Likelihood in real-world scenarios

### 4. Mitigation Analysis
Review existing protections and identify gaps in:
- Rate limiting and attempt throttling
- Hardware security integration
- Key derivation strength
- Salt randomization
- Memory protection
- Logging and information disclosure

## Output Requirements

Create a detailed security audit report at `./docs/mnemonic_security_audit_{current_date}.md` with this structure:

```markdown
# Mnemonic Security Audit

Date: {current_date}
Branch: {current_branch}
Scope: Review of repository code paths that could lead to exposure or exfiltration of a user's mnemonic ("recovery phrase") or enable a sophisticated attack to extract it.

## Executive Summary
[Provide high-level overview of findings and risk assessment]

Risk rating legend: High – practical path to mnemonic compromise with moderate attacker capability. Medium – increases likelihood given additional conditions. Low – theoretical or requires powerful attacker (e.g., runtime compromise) but still improvable.

## Findings
[Detail each vulnerability with severity rating, description, and impact]

## Attack Scenarios
[Describe practical attack scenarios for high/critical findings]

## Prioritized Remediations
[List fixes in order of security impact and implementation priority]

## Additional Code-Level Recommendations
[Specific code changes with file references and line numbers]

## Migration Considerations
[Backward compatibility and data migration requirements]

## Testing & Verification Additions
[Recommended security tests and validation approaches]

## Residual Risks
[Remaining risks after implementing recommendations]

## Conclusion
[Summary of security posture and next steps]
```

## Quality Standards
- All high and critical findings must include proof-of-concept attack scenarios
- Recommendations must be technically feasible within React Native/Expo constraints
- Code references must include specific file names and line numbers where applicable
- Mitigation suggestions must include implementation complexity estimates
- Backward compatibility and migration paths must be considered

## Important Notes
- Focus on practical, exploitable vulnerabilities rather than theoretical issues
- Consider the mobile app threat model and typical attack vectors
- Balance security improvements with development effort and user experience
- Prioritize fixes that provide maximum security improvement for minimum implementation cost
- Document any assumptions about attacker capabilities and threat models