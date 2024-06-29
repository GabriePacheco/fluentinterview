import { useEffect, useState } from 'react';

const LanguageFlags = ({ filter, onSelect }) => {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all');
                const data = await response.json();
                setCountries(data);
                setFilteredCountries(data)
           
            } catch (err) {
                setError(err.message);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        const applyFilter = () => {
     
            const filtered = countries.filter((country) =>
                country.languages &&
                Object.values(country.languages).some((lang) => lang?.toLowerCase().includes(filter.toLowerCase() ))
            );
            setFilteredCountries(filtered);
        };

        applyFilter();
    }, [filter]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    const handdleSelet = (lang)  => {
        onSelect &&  typeof onSelect === 'function' &&  onSelect(lang)
    }

    return (
        <div className="p-4">
            <ul className="flex flex-col gap-4 justify-center">
                {filteredCountries.map((country) =>
                    country.languages && (
                        Object.values(country.languages).map((language, index) => (
                            <li 
                                onClick={() => handdleSelet(language)}
                                key={`${country.cca3}-${index}`} 
                                className="flex items-center space-x-2 hover:bg-secondary p-2 rounded-lg">
                                <img
                                    src={country.flags.svg}
                                    alt={`${country.name.common} flag`}
                                    className="w-6 h-6"
                                />
                                <span>{language}</span>
                            </li>
                        ))
                    )
                )}
            </ul>
        </div>
    );
};

export default LanguageFlags;
