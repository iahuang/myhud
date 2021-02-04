import ServerInterface from "../server_interface";

export default class SongWidget extends Component {
    nowPlayingCache: SpotifyApi.CurrentlyPlayingResponse | null = null;
    songPositionCache = {
        progress: 0,
        duration: 0,
    };

    serverInterface: ServerInterface;

    constructor(si: ServerInterface) {
        super();

        this.serverInterface = si;

        // initially set "now playing" data
        si.nowPlaying().then((resp) => {
            this.nowPlayingCache = resp;
            this.rerender();
        });

        setInterval(() => {
            /* Increment song progress client-side */

            if (this.nowPlayingCache?.is_playing) {
                this.songPositionCache.progress += 500;
            }

            // prevent song bar from going past the end of the song;
            if (
                this.songPositionCache.progress >
                this.songPositionCache.duration
            ) {
                this.songPositionCache.progress = this.songPositionCache.duration;
            }
            htmless.rerender("time");
        }, 500);

        setInterval(async () => {
            /* Periodically refresh "now-playing" widget */
            this.nowPlayingCache = await this.serverInterface.nowPlaying();
            htmless.rerender(this);
        }, 3000);
    }

    progressBar(timePlayed: number, songLength: number) {
        return span(
            this.timeString(timePlayed),
            div(
                div()
                    .class("np-time-progress")
                    .style({ width: (timePlayed / songLength) * 100 + "%" })
            ).class("np-time-bar")
        ).class("np-time-span");
    }

    truncateSongName(name: string, maxLength = 32) {
        if (name.length + 3 > maxLength) {
            return name.substring(0, maxLength - 3) + "...";
        }
        return name;
    }

    makeSongNameElement(song: SpotifyApi.TrackObjectFull) {
        let children: any[] = [];

        // add artist links
        let first = true;
        for (let artist of song.artists.slice(0, 2)) {
            // only add commas between artists
            if (!first) {
                children.push(", ");
            }
            if (first) {
                first = false;
            }

            children.push(
                span(hyperlink(artist.name).href(artist.external_urls.spotify))
            );
        }

        if (song.artists.length > 2) {
            children.push(", et. al.");
        }

        children.push(" − ");
        let name = this.truncateSongName(song.name);
        children.push(
            hyperlink(name).href(song.external_urls.spotify).class("np-link")
        );

        return div(...children);
    }

    timeString(ms: number) {
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
        let s = Math.floor(ms / 1000);
        let secs = s % 60;
        let mins = Math.floor(s / 60);
        return zeroPad(mins) + ":" + zeroPad(secs);
    }

    body() {
        if (this.nowPlayingCache === null) {
            return div(
                image("no_song.png").class("np-album"),
                div(
                    span("Now playing ♪").class("np-label"),
                    inlineHTML(
                        '<div class="np-song no-song">afsdlkjfasdkfsdadsfjafsljdadfjs</div>'
                    ),
                    htmless
                        .inlineComponent(() => this.progressBar(0, 10))
                        .id("time")
                )
            ).class("np-widget");
        }
        let song = this.nowPlayingCache.item!;
        this.songPositionCache = {
            progress: this.nowPlayingCache.progress_ms || 0,
            duration: song.duration_ms,
        };
        return div(
            image(song.album.images[0].url).class("np-album"),
            div(
                span("Now playing ♪").class("np-label"),
                this.makeSongNameElement(song).class("np-song"),
                htmless
                    .inlineComponent(() =>
                        this.progressBar(
                            this.songPositionCache.progress,
                            this.songPositionCache.duration
                        )
                    )
                    .id("time")
            )
        ).class("np-widget");
    }
}
