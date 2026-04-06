import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) await fetchProfile(u.id)
        else setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async ({ email, password, username }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user && username) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id)
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const setTripId = async (tripId) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ trip_id: tripId.trim() })
      .eq('id', user.id)
    if (error) throw error
    await fetchProfile(user.id)
  }

  return { user, profile, loading, signUp, signIn, signOut, setTripId, fetchProfile }
}
