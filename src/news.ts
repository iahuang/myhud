import fetch from "node-fetch";
import jsdom from "jsdom";
import { fstat, writeFileSync } from "fs";

export interface NewsArticle {
    url: string;
    headline: string;
}

export class WashingtonPost {
    async getHeadlines(): Promise<NewsArticle[]> {
        console.log("Fetching news...")
        let resp = await fetch("https://www.washingtonpost.com");
        let body = await resp.text();

        let dom = new jsdom.JSDOM(body);
        let headlines = [];

        // not news
        const bannedCategories = [
            "goingoutguide",
            "lifestyle",
            "travel",
            "food",
            "opinions",
            "entertainment"
        ];
        for (let el of dom.window.document.getElementsByClassName("font--headline")) {

            if (!el.children.length) {
                continue;
            }
            let link = el.children[0].getAttribute("href");
            if (link === null) {
                continue;
            }
            let headline = el.textContent;

            let category = (new URL(link)).pathname.split("/")[1];

            if (bannedCategories.includes(category)) {
                continue;
            }

            headlines.push({
                url: link,
                headline: headline!
            });
        }
        writeFileSync("_test.json", JSON.stringify(headlines));

        // https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
        function shuffleArray<T>(array: T[]) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }
        
        shuffleArray(headlines);
        return headlines;
    }
}

export class APNews {
    async getHeadlines() {
        console.log("Fetching news...")
        let resp = await fetch("https://apnews.com");
        let body = await resp.text();

        let dom = new jsdom.JSDOM(body);

        let headlines = [];
        let document = dom.window.document;

        for (let div of document.getElementsByTagName("div")) {
            if (div.getAttribute("key") === "related-story-headline") {
                headlines.push(div.textContent!);
                continue;
            }
            for (let className of div.classList) {
                if (className.startsWith("Component-headline")) {
                    headlines.push(div.textContent!);
                    continue;
                }

                if (className.startsWith("storyHeadlines")) {
                    headlines.push(div.textContent!);
                    continue;
                }
            }
        }

        return headlines;
    }
}
