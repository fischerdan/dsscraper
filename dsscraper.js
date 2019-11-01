const axios = require("axios");
const cheerio = require("cheerio");
const moment = require('moment');

function Article(url,title) {
  // always initialize all instance properties
  this.url = url;
  this.title = title;
  this.hits = "";
  this.dateTime = "";
  this.author = "";
  this.topTag = "";
  this.newUsers = "";
}

async function processPage(pageUrl){
  console.log(pageUrl);
  const fetchData = async () => {
    const result = await axios.get(pageUrl);
    return cheerio.load(result.data);
  };
  var articles = {};
  const pageData = await fetchData();
  pageData("h1").each((index, element) => {
    const articleURL = pageData(element).parent().attr('href');
    //console.log(articleURL);
    articles[articleURL] = new Article(articleURL,pageData(element).text());
    
  });

  var lastDateTime = "";
  for(var url in articles) {
    const fetchArticle = async () => {
      const article = await axios.get(url);
      return cheerio.load(article.data);
    };
    const articleData = await fetchArticle();
    var hits = articleData('[title*="New Visitors"]').text();
    var newUsers = articleData('[title*="New Visitors"]').attr('title');
    const date = articleData('[class*="js_meta-time"]').parent().attr('datetime');
    const author = articleData('[data-ga*="Permalink meta\",\"Author click\""]').text();
    const tag = articleData('[data-ga*="Permalink meta\",\"Tag click\",\"First tag click\""]').text();
    
    articles[url].hits = convertHitToNumber(hits);
    if(newUsers != null){
      articles[url].newUsers = convertHitToNumber(newUsers.replace("New Visitors",""));
    }
    articles[url].dateTime = date;
    articles[url].author = author;
    articles[url].topTag = tag.replace("Filed to:","");
    lastDateTime = date;
  };
  const realDate = moment.utc(lastDateTime);
  //console.log(articles);
  //console.log(realDate.valueOf());
  writeArticlesToDB(articles);
  processPage("https://deadspin.com/?startTime=" + realDate.valueOf());
}

function convertHitToNumber(hits){
  if(hits.includes("K")){
    hits = hits.replace("K","");
  }
  else{
    if(hits.includes("M")){
      hits = hits.replace("M","");
      hits = parseFloat(hits) * 1000
    }
    else
    {
      hits = parseFloat(hits)
      if(isNaN(hits)){
        hits = "0";
      }
      else{
        hits = hits/1000
      }
    }
  }
  return hits;
}

async function writeArticlesToDB(articles){
  //save em somewhere
}

function isDeadspin(url){
  return url.includes("deadspin");
}