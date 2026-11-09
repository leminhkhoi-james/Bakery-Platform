import { displayRuntime } from '../displayRuntime.js'
import { simulationStore } from '../business/runtime.js'
import { businessUserDirectory } from '../business/userDirectory.js'

export const localUserDirectory = () => simulationStore() ? businessUserDirectory(simulationStore()) : displayRuntime?.sources.get('/admin/users') === 'demo' ? displayRuntime.userDirectory : null
export function localUserRestriction(person) {
  return (typeof localUserDirectory()?.restriction === 'function' ? localUserDirectory().restriction(person, null, 'delete') : null) || null
}
