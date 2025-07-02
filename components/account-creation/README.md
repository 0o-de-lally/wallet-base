# Account Creation Components

This folder contains components for creating new accounts with generated mnemonics, similar to the "recover account" flow but for generating new accounts.

## Components

### NewAccountWizard
The main wizard component that orchestrates the account creation flow:
1. Generates a new mnemonic phrase
2. Collects account details (nickname, profile)
3. Creates the account and stores the mnemonic securely
4. Shows success confirmation

**Props:**
- `onComplete?: () => void` - Called when the wizard is completed

### GeneratedMnemonicDisplay
Displays a generated mnemonic phrase with options to copy or regenerate.

**Props:**
- `mnemonic: string` - The mnemonic phrase to display
- `onRegenerate: () => void` - Callback to generate a new mnemonic
- `isLoading?: boolean` - Loading state

### AccountDetailsForm
Form for collecting account details before creation.

**Props:**
- `onConfirm: (profileName: string, nickname: string) => void` - Called when form is submitted
- `isLoading?: boolean` - Loading state
- `error?: string | null` - Error message to display

### AccountCreationSuccess
Success screen shown after account creation.

**Props:**
- `accountId: string` - ID of the created account
- `accountNickname: string` - Nickname of the created account
- `onContinue: () => void` - Callback to continue
- `onViewAccount: () => void` - Callback to view the account

## Usage

The NewAccountWizard can be used standalone or integrated into existing flows:

```tsx
import { NewAccountWizard } from "./components/account-creation";

<NewAccountWizard onComplete={() => router.push("/")} />
```

## Security

- Mnemonics are generated using the same secure method as the existing system
- Mnemonics are encrypted and stored using PIN-based secure storage
- Follows the same patterns as the existing "recover account" flow
