const HTMLParser = require('node-html-parser'); 
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

(async () => {
    const startingValue = await prompt("What's the starting word? ");
    const target = await prompt("What's the target word? ");
    rl.close(); 
    
    const startSpinner = (target: string) => {
        const frames = ['-', '\\', '|', '/'];
        let frameIndex = 0;
        
        console.log('');
        const interval = setInterval(() => {
            process.stdout.write('\r' + frames[frameIndex] + ' Searching for ' + target + '...');
        
            frameIndex = (frameIndex + 1) % frames.length;
        }, 100);
        
        return interval;
    }
    
    const stopSpinner = (interval: any) => {
        clearInterval(interval);
        process.stdout.write('\r'); // Clear the line
    }

    
    const baseURI = 'https://de.wikipedia.org'
    const visitedPages: any = []
    let foundTarget = false
    let now = Date.now()
    
    try {
        const spinnerInterval = startSpinner(target);
        const res = await fetch(`${baseURI}/wiki/${startingValue.toLowerCase()}`)
        const data = await res.text()
        const root = HTMLParser.parse(data)
        const mainContent = root.querySelector('#content')

        const fetchLinks = async (page = mainContent) => {
            const pageTitle = page.querySelector('h1').innerText 
            const links: any = page.querySelectorAll('a')
                .filter((link: any) => {
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
                        || !link.hasAttribute('title')
                    ) return false
                    return true
                })
            const articles = links.map((link: any) => link.getAttribute('title'))
            
            if (visitedPages.includes(pageTitle)) return
            visitedPages.push(pageTitle)
            // console.log(pageTitle)
            
            if (articles.includes(target)) {
                foundTarget = true
                stopSpinner(spinnerInterval);
                readline.clearLine(process.stdout, 0); 
                console.log('');
                console.log(`Found target ${target} on page ${pageTitle} in ${((Date.now() - now) / 1000).toFixed(1)} s`);
                return
            }
            
            if (links.length) {
                for (const link of links) {
                    if (foundTarget) return
                    
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

            // console.log(`checking page... ${pageTitle}`);

            // if (titles.indexOf(target) !== -1) {
            //     foundTarget = true
            //     console.log('');
            //     console.log('################');
            //     console.log('');
            //     console.log(`found target ${target}`);
            //     console.log(`needed ${titles.length - 1} iterations`);
            // }

            // if (links.length) {
            //         const articles = links
            //             .filter((link: any) => {
            //                 if (
            //                     !link.hasAttribute('href') 
            //                     || (link.hasAttribute('href') && !link.getAttribute('href').startsWith('/wiki')) 
            //                     || link.getAttribute('href').endsWith('.jpg') 
            //                     || link.getAttribute('href').endsWith('.jpeg') 
            //                     || link.getAttribute('href').endsWith('.svg')
            //                     || link.getAttribute('href').endsWith('.png')
            //                     || link.getAttribute('href').includes(':Belege')
            //                     || link.getAttribute('href').includes('Diskussion:')
            //                     || link.getAttribute('href').includes('Hilfe:')
            //                     || link.getAttribute('href').includes('Wikipedia:')
            //                     || link.getAttribute('href').includes(':Einzelnachweis')
            //                     || !link.hasAttribute('title')
            //                 ) return false
            //                 return true

            //             })
            //             .map((link: any) => link.getAttribute('title')) 

            //             console.log(articles,target);

            //         if (articles.includes(target)) {
            //             foundTarget = true
            //             console.log('');
            //             console.log('################');
            //             console.log('');
            //             console.log(`found target ${target}`);
            //             console.log(`needed ${titles.length - 1} iterations`);
            //             return
            //         }

            //         for (const link of links) {
            //             if (
            //                 !link.hasAttribute('href') 
            //                 || (link.hasAttribute('href') && !link.getAttribute('href').startsWith('/wiki')) 
            //                 || link.getAttribute('href').endsWith('.jpg') 
            //                 || link.getAttribute('href').endsWith('.jpeg') 
            //                 || link.getAttribute('href').endsWith('.svg')
            //                 || link.getAttribute('href').endsWith('.png')
            //                 || link.getAttribute('href').includes(':Belege')
            //                 || link.getAttribute('href').includes('Diskussion:')
            //                 || link.getAttribute('href').includes('Hilfe:')
            //                 || link.getAttribute('href').includes('Wikipedia:')
            //                 || link.getAttribute('href').includes(':Einzelnachweis')
            //             ) continue
                            
            //             if (foundTarget) {
            //                 return 
            //             }
    
            //             try {
            //                 const res = await fetch(`${baseURI}/${link.getAttribute('href')}`)
            //                 const data = await res.text()
            //                 const html = HTMLParser.parse(data)
                            
            //                 await fetchLinks(html.querySelector('#content'))
            //             } catch (error) {
            //                 console.log(`Error: ${error}`);
            //             }
            //         }



            // }

        }

        await fetchLinks()
    } catch (error) {
        console.log(`error: ${error}`)
    }



})()