import { useContext, createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc } from "firebase/firestore";
import { app, db } from '../firebaseConfig'


const authContext = createContext()

export const AuthProvider = ({ children }) => {

    const auth = getAuth(app)
    auth.languageCode = 'es'

    const [user, setUser] = useState(null)
    const [userSettings, setUserSetting] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsLoading(true)

        const u = onAuthStateChanged(auth, snapUser => {
            if (snapUser) {
                setUser(snapUser)
                let ref = doc(db, 'users', snapUser.uid)
                getDoc(ref)
                    .then((snapDoc) => {
                        setUserSetting(snapDoc.data())
                        setIsLoading(false)

                    })
                    .catch(error => {
                        setIsLoading(false)
                    })
                //TODO: GUARDAR ESTADISTICAS DE INGRESOS

            }
        })

        return () => u()


    }, [])

    const login = () => {
        setIsLoading(true)
        const provider = new GoogleAuthProvider()
        signInWithPopup(auth, provider)
            .then((result) => {
                setIsLoading(false)

            })
            .catch((err) => (setIsLoading(false)))

    }

    const logOuth = () => {
        signOut(auth)
            .then(() => setUser(false))
    }


    return <authContext.Provider value={{ user, login, logOuth, userSettings, isLoading }} >
        {children}
    </authContext.Provider>
}

export const useAuth = () => useContext(authContext)
