export default class ClockWidget extends Component {
    twelveHour: boolean;
    constructor() {
        super();
        this.twelveHour = true; // ampm vs. 24 hour

        // update the clock every second
        setInterval(() => {
            this.rerender();
        }, 1000);
    }

    timeString() {
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
        let d = new Date();
        if (this.twelveHour) {
            let h = d.getHours() % 12;
            if (h == 0) {
                h = 12;
            }
            let m = d.getMinutes();

            return h + ":" + zeroPad(m);
        } else {
            let h = d.getHours();
            let m = d.getMinutes();

            return zeroPad(h) + ":" + zeroPad(m);
        }
    }

    setTwelveHour(to: boolean) {
        this.twelveHour = to;
        this.rerender();
    }

    body() {
        let date = new Date();
        let h = date.getHours();
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());

        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        let dateString = `${days[date.getDay()]}, ${
            months[date.getMonth()]
        } ${date.getDate()}`;

        let ampm;

        if (this.twelveHour) {
            ampm = h >= 12 ? "PM" : "AM";
        } else {
            ampm = "";
        }

        return div(
            span(
                span(this.timeString()).class("cl-hm"),
                span(ampm).class("cl-ampm")
            ).class("cl-time"),
            span(dateString).class("cl-date")
        ).class("clock");
    }
}
