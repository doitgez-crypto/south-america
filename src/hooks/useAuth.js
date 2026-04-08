import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FIXED_TRIP_ID = import.meta.env.VITE_TRIP_ID

const PROJECT_ID = 'tblppttmjzthnolnzrjr'
const TOKEN_KEY = `sb-${PROJECT_ID}-auth-token`

export function useAuth() {
  const [user, setUser]       = useState(() => {
    try {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (stored) {
        const session = JSON.parse(stored)
        return session.user || null
      }
    } catch (e) {}
    return null
  })
  const [profile, setProfile] = useState(null)
  
  // If we already have a user in cache, we skip the initial "Checking..." spinner
  const [loading, setLoading] = useState(!user)
  const [error, setError]     = useState(null)

  const fetchProfile = useCallback(async (uid) => {
    try {
      console.log('DEBUG Fetching Profile for UID:', uid)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) {
        console.error('DEBUG Select Profile Error:', error)
        throw error
      }

      if (!data) {
        console.log('DEBUG Profile missing, attempting to create...')
        const { data: userData } = await supabase.auth.getUser()
        const currentUser = userData.user
        
        const insertData = {
          id: uid,
          email: currentUser?.email || '',
          username: currentUser?.email?.split('@')[0] || 'User',
          trip_id: FIXED_TRIP_ID || ''
        }

        console.log('DEBUG Attempting Insert with:', insertData)
        console.log('DEBUG Current Auth User ID:', currentUser?.id)
        console.log('DEBUG Matches UID?', currentUser?.id === uid)
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(insertData)
          .select()
          .maybeSingle()
        
        if (createError) {
          console.error('DEBUG Create Profile Error:', createError)
          throw createError
        }
        console.log('DEBUG Profile created successfully:', newProfile)
        setProfile(newProfile)
      } else if (data && !data.trip_id && FIXED_TRIP_ID) {
        console.log('DEBUG Profile exists but missing trip_id, auto-assigning...')
        const { data: updated, error: upError } = await supabase
          .from('profiles')
          .update({ trip_id: FIXED_TRIP_ID })
          .eq('id', uid)
          .select()
          .maybeSingle()
        
        if (upError) {
          console.error('DEBUG Update Profile Error:', upError)
          throw upError
        }
        setProfile(updated)
      } else {
        console.log('DEBUG Profile loaded successfully')
        setProfile(data)
      }
    } catch (err) {
      console.error('DEBUG Error fetching profile:', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      // Safety timeout: if auth takes > 5s, stop loading to allow manual retry/login
      const timeout = setTimeout(() => {
        if (isMounted) {
          console.warn('Auth initialization timed out.')
          setLoading(false)
        }
      }, 5000)

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
           console.error('Session error:', sessionError)
           setUser(null)
           setProfile(null)
           throw sessionError
        }

        if (!isMounted) return
        
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          await fetchProfile(u.id)
        }
      } catch (err) {
        console.error('Auth initialization failed:', err)
        setError('שגיאה באימות המשתמש. נסה לרענן.')
      } finally {
        clearTimeout(timeout)
        if (isMounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        const u = session?.user ?? null
        setUser(u)
        
        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' && u) {
          // App.jsx handles the skeleton automatically if profile is missing
          await fetchProfile(u.id)
        }
      }
    )
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async ({ email, password, username }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          username: username || email.split('@')[0],
          trip_id: FIXED_TRIP_ID || ''
        })
      if (profileError) console.error('Error creating profile on signup:', profileError)
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    try {
      console.log('Attempting sign out...')
      // Clear state immediately to avoid being stuck in loading if signOut hangs
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Supabase signOut error:', error)
      
      console.log('Sign out successful, reloading...')
      window.location.reload()
    } catch (err) {
      console.error('Catch-all sign out error:', err)
      localStorage.clear()
      window.location.reload()
    }
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

  return { user, profile, loading, error, signUp, signIn, signOut, setTripId, fetchProfile }
}
