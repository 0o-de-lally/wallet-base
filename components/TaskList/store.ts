import { observable } from '@legendapp/state'

import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { syncObservable } from '@legendapp/state/sync'

// Define types
interface UserAccount {
  id: number
  account: string
  nickname: string
  balance: number
  view_only: boolean
}

// Create an observable store
export const store$ = observable({
  userAccounts: [] as UserAccount[]
})

// Configure persistence
syncObservable(store$, {
  persist: {
    name: 'todos-store',
    plugin: ObservablePersistMMKV
  }
})
