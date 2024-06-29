
import { CgClose } from 'react-icons/cg'
import loginImg from '../assets/login.png'
import { Link, Navigate } from 'react-router-dom'
import { FcGoogle } from "react-icons/fc";

import Logo from '../components/Logo'
import { useAuth } from '../context/authContext'

const Login = () => {
    const { login, user } = useAuth()
    if ( user ) return <Navigate  to = "/app" />
    return (
        <section className='w-full h-screen bg-normal'>
            <div className='w-full h-full flex justify-center items-center'>
                <div className='lg:w-3/6 h-3/6 w-11/12 bg-white shadow-lg rounded-xl flex justify-center items-center overflow-hidden relative'>
                    <div className='w-1/2 hidden  h-full overflow-hidden md:flex justify-center items-center bg-blue-500 rounded-lg'>
                        <img src={loginImg} alt='login-app image' className='w-full h-full object-cover' />

                    </div>
                    <div className='lg:w-1/2 w-full  relative flex flex-col justify-center items-center gap-3'>
                        <Logo />
                        <p className='text-center text-sm'>Sign in to start practicing your interviews</p>
                        <button 
                            onClick={() => login()}
                            className='rounded-xl flex justify-center items-center gap-2 bg-normal py-2 md:px-5 px-2  md:w-3/6 w-11/12 shadow border'>
                            <FcGoogle />
                            <strong>Continue with Google</strong>
                            
                        </button>
                    </div>
                    <Link className='absolute top-2 right-2 p-1 ' to='/'><CgClose /></Link>

                </div>

            </div>
        </section>
    )
}

export default Login