import { resolve } from "dns";

const HTMLParser = require('node-html-parser'); 

(async () => {
    const baseURI = 'https://de.wikipedia.org'
    const startingValue = 'Deutschland'
    const target = 'Zeichensatz'
    const titles: any = []
    let foundTarget = false


    console.time();

    try {
        const res = await fetch(`${baseURI}/wiki/${startingValue.toLowerCase()}`)
        const data = await res.text()
        const root = HTMLParser.parse(data)
        const mainContent = root.querySelector('#content')

        const fetchLinks = async (page = mainContent) => {
            const links: any = page.querySelectorAll('a')
            const pageTitle = page.querySelector('h1').innerText 

            if (titles.indexOf(pageTitle) !== -1) return
            
            titles.push(pageTitle)

            console.log(`checking page... ${pageTitle}`);

            if (titles.indexOf(target) !== -1) {
                foundTarget = true
                console.log('');
                console.log('################');
                console.log('');
                console.log(`found target ${target}`);
                console.log(`needed ${titles.length - 1} iterations`);
            }

            if (links.length) {
                    for (const link of links) {
                        if (
                            !link.hasAttribute('href') 
                            || (link.hasAttribute('href') && !link.getAttribute('href').startsWith('/wiki')) 
                            || link.getAttribute('href').endsWith('.jpg') 
                            || link.getAttribute('href').endsWith('.jpeg') 
                            || link.getAttribute('href').endsWith('.svg')
                            || link.getAttribute('href').endsWith('.png')
                            || link.getAttribute('href').includes(':Belege')
                            || link.getAttribute('href').includes('Diskussion:')
                            || link.getAttribute('href').includes('Hilfe:')
                            || link.getAttribute('href').includes('Wikipedia:')
                            || link.getAttribute('href').includes(':Einzelnachweis')
                        ) continue
                            
                        if (foundTarget) {
                            return 
                        }
    
                        try {
                            const res = await fetch(`${baseURI}/${link.getAttribute('href')}`)
                            const data = await res.text()
                            const html = HTMLParser.parse(data)
                            
                            await fetchLinks(html.querySelector('#content'))
                        } catch (error) {
                            console.log(`Error: ${error}`);
                        }
                    }



            }

        }

        await fetchLinks()
    } catch (error) {
        console.log(`error: ${error}`)
    }

    console.timeEnd();
    

})()