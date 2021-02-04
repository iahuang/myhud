import ServerInterface from "../server_interface";

export default class NewsWidget extends Component {
    refreshTime = 20000; // ms
    currentHeadline: any | null = null;

    serverInterface: ServerInterface;

    constructor(si: ServerInterface) {
        super();

        this.serverInterface = si;

        // initial fetch
        this.serverInterface.nextHeadline().then((resp) => {
            this.currentHeadline = resp;
            htmless.rerender("nw-headline");
        });

        // periodic news fetches
        setInterval(async () => {
            this.currentHeadline = await this.serverInterface.nextHeadline();
            const political = ["politics", "legal-issues"];
            const politicalKw = [
                "trump",
                "aoc",
                "mcconnell",
                "biden",
                "obama",
                "ocasio",
                "giuliani",
                "sanders",
                "senate",
                "democrat",
                "republican",
                "gop",
            ];

            let cb = document.getElementById("politics-cb") as HTMLInputElement;
            let skipPolitical = cb.checked;

            while (skipPolitical) {
                if (this.currentHeadline === null) {
                    break;
                }
                let category = this.getCategoryFromUrl(
                    this.currentHeadline.url
                );

                let check = false;
                for (let kw of politicalKw) {
                    if (
                        this.currentHeadline.headline.toLowerCase().includes(kw)
                    ) {
                        check = true;
                    }
                }

                if (!check && !political.includes(category)) {
                    break;
                }

                // console.log("skipping",this.currentHeadline);

                this.currentHeadline = await this.serverInterface.nextHeadline();
            }

            htmless.rerender("nw-headline");
        }, this.refreshTime);
    }

    getCategoryFromUrl(url: string) {
        let path = new URL(url).pathname.split("/").slice(1);
        let category;

        if (path[0] == "local") {
            category = path[1];
        } else {
            category = path[0];
        }

        return category;
    }

    renderHeadline() {
        let newsHeadline;

        if (!this.currentHeadline) {
            newsHeadline = span("Loading...").class("nw-headline");
        } else {
            newsHeadline = hyperlink(this.currentHeadline.headline)
                .href(this.currentHeadline.url)
                .class("nw-headline");
        }
        return newsHeadline;
    }

    body() {
        return div(
            span(
                headers.h1("Current News").class("nw-header"),
                span("Hide politics"),
                input.checkbox().id("politics-cb")
            ).class("nw-top"),
            htmless
                .inlineComponent(() => this.renderHeadline())
                .id("nw-headline")
        ).class("news-widget");
    }
}
