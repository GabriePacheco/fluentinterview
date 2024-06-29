import React from 'react'
import Logo from './Logo'
import { Link } from 'react-router-dom'
import Button from './Button'


const Nav = () => {
    return <nav className='fixed top-0 left-0 w-full' >
        <div className="container mx-auto p-4 flex justify-between items-center">
            <Link to="/" >
                <Logo />
            </Link>
            <div className='flex gap-3 items-center'>
             
                <Link  to = "/login">
                    <Button>Get Started for Free</Button>
                </Link>
            </div>

        </div>

    </nav>
}

export default Nav