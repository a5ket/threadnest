import { PreferenceSettingsPanel } from '@/features/user-preference/components/preference-settings-panel'
import { getPreferencesServer } from '@/features/user-preference/user-preference.server'

export default async function PreferencesPage() {
  const preference = await getPreferencesServer()

  return (
    <div className='flex flex-col gap-6'>
      <h1 className='text-lg font-semibold'>Preferences</h1>

      <PreferenceSettingsPanel initialPreference={preference} />
    </div>
  )
}
