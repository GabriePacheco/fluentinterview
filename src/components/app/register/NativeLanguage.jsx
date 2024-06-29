import React, { useState } from 'react'
import { BiSearch } from 'react-icons/bi'
import LanguageList from './LanguageList'

const NativeLanguage = ({save}) => {
    const [filter, setFilter] = useState('')
    return (
        <div className="w-full h-full">
            <h3 className='text-center pt-1 text-2xl font-bold'>What is your Nativer Language?</h3>
            <p className='text-xl text-center my-8'>You'll get AI hints, feedback and trasnlations in your naive languages during conversations with Avatars.</p>
            <div className='mt-12 rounded-lg border flex justify-start items-center py-2 px-3 gap-2 bg-secondary'>
                <BiSearch />
                <input
                    type='search'
                    onChange={(e) => setFilter(e.target.value)}
                    value={filter}
                    className='w-full  rounded-lg  outline-none bg-transparent' />

            </div>

            <LanguageList  filter={filter} onSelect={(language) =>  save({'nativeLanguage' :  language})} />
        </div>
    )
}

export default NativeLanguage