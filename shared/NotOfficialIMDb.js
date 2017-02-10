#!/usr/bin/env node

const cmd = require('commander'),
    fs = require('fs'),
    request = require('request'),
    {jsdom} = require('jsdom'),
    xml = require('xml'),
    {version} = require('./package.json');

cmd.version(version)
    .option('-o --out <output file>', 'output file');

cmd.command('getVideoScraperAPIVersion')
    .allowUnknownOption()
    .description('get scraper version')
    .action(function() {
        console.log(version);
    });

cmd.command('getlanguagesupport')
    .allowUnknownOption()
    .description('get lang support')
    .action(function() {
        console.log(`en,English`);
    });

cmd.command('searchmovie')
    .allowUnknownOption()
    .description('search movie list')
    .option('-t --title <title>', 'title')
    .action(function(options) {
        if(options.title) {
            request(`https://www.googleapis.com/customsearch/v1?key=AIzaSyC-u6DT7yqqGpWmm2pgDpslkh4CxX6LysU&cx=005198342056190109795:nxd_7xdatds&q=${encodeURIComponent(options.title)}`, function(error, resp, body) {
                if(!error && resp.statusCode === 200) {
                    let movielist = [],
                        data = JSON.parse(body);

                    data.items.forEach((item, index) => {
                        if(item.pagemap.metatags[0].subpagetype === 'main' && item.pagemap.metatags[0]['og:type'] === 'video.movie') {
                            movielist.push({
                                movie: [
                                    {
                                        _attr: {
                                            rank: index
                                        }
                                    },
                                    {
                                        url: {
                                            _cdata: item.pagemap.metatags[0]['og:image']
                                        }
                                    },
                                    {
                                        id: {
                                            _cdata: item.pagemap.metatags[0].pageid
                                        }
                                    },
                                    {
                                        title: {
                                            _cdata: item.pagemap.metatags[0]['og:title']
                                        }
                                    },
                                    {
                                        year: {
                                            _cdata: item.pagemap.moviereview[0].release_year
                                        }
                                    },
                                    {
                                        outline: {
                                            _cdata: item.pagemap.metatags[0]['og:description']
                                        }
                                    }
                                ]
                            });
                        }
                    });

                    let xmlResult = xml({movielist: movielist}, {
                        declaration: {
                            encoding: 'UTF-8'
                        },
                        indent: true
                    });

                    if(cmd.out) {
                        fs.writeFileSync(cmd.out, xmlResult);
                    } else {
                        console.log(xmlResult);
                    }
                }
            });
        } else {
            cmd.outputHelp();
        }
    });

cmd.command('getmovieinfobyid')
    .allowUnknownOption()
    .description('get detail')
    .option('-i --id <id>', 'id')
    .action(function(options) {
        if(options.id) {
            request(`http://www.imdb.com/title/${encodeURIComponent(options.id)}/`, function(error, resp, body) {
                if(!error && resp.statusCode === 200) {
                    let document = jsdom(body);

                    let genre = Array.prototype.reduce.call(document.querySelectorAll('span[itemprop=genre]'), function(list, genre) {
                        return [...list, {
                            genre: {
                                _cdata: genre.textContent
                            }
                        }];
                    }, []);

                    let role = document.querySelectorAll('#titleCast .character');
                    let actor = Array.prototype.reduce.call(document.querySelectorAll('[itemprop=actor] [itemprop=name]'), function(list, actor, currentIndex) {
                        return [...list, {
                            actor: [{
                                name: {
                                    _cdata: actor.textContent
                                },
                            }, {
                                role: {
                                    _cdata: role[currentIndex].textContent.replace(/[\s]+/g, ' ').trim()
                                }
                            }]
                        }];
                    }, []);

                    let result = {
                        movie: [
                            {
                                title: {
                                    _cdata: (document.querySelector('.title_wrapper [itemprop=name]')) ? document.querySelector('.title_wrapper [itemprop=name]').firstChild.textContent.trim() : ''
                                }
                            },
                            {
                                year: {
                                    _cdata: (document.querySelector('#titleYear')) ? document.querySelector('#titleYear').textContent.replace(/\D/g, '') : ''
                                }
                            },
                            {
                                rating: {
                                    _cdata: (document.querySelector('[itemprop=ratingValue]')) ? document.querySelector('[itemprop=ratingValue]').textContent : ''
                                }
                            },
                            {
                                id: {
                                    _cdata: options.id
                                }
                            },
                            {
                                director: {
                                    _cdata: (document.querySelector('[itemtype="http://schema.org/Person"][itemprop=director] [itemprop=name]')) ? document.querySelector('[itemprop=director] [itemprop=name]').textContent : ''
                                }
                            },
                            {
                                company: {
                                    _cdata: (document.querySelector('[itemtype="http://schema.org/Organization"][itemprop=creator] [itemprop=name]')) ? document.querySelector('[itemtype="http://schema.org/Organization"][itemprop=creator] [itemprop=name]').textContent : ''
                                }
                            },
                            {
                                poster: {
                                    _cdata: (document.querySelector('.poster [itemprop="image"]')) ? document.querySelector('.poster [itemprop="image"]').src : ''
                                }
                            }
                        ]
                    };

                    result.movie = result.movie.concat(genre);
                    result.movie = result.movie.concat(actor);

                    let xmlResult = xml(result, {
                        declaration: {
                            encoding: 'UTF-8'
                        },
                        indent: true
                    });

                    if(cmd.out) {
                        fs.writeFileSync(cmd.out, xmlResult);
                        process.exit(0);
                    } else {
                        console.log(xmlResult);
                        process.exit(0);
                    }
                }
            });
        }
    });

cmd.command('*')
    .allowUnknownOption()
    .action(function() {
        cmd.outputHelp();
    });

cmd.parse(process.argv);

if(!cmd.args.length) {
    cmd.outputHelp();
}
