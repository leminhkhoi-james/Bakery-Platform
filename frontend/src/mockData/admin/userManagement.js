import { displayRuntime } from '../displayRuntime.js'

export const localUserDirectory = () => displayRuntime?.sources.get('/admin/users') === 'demo' ? displayRuntime.userDirectory : null
export function localUserRestriction(person) {
  return (typeof localUserDirectory()?.restriction === 'function' ? localUserDirectory().restriction(person, null, 'delete') : null) || null
}
