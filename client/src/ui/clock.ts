export default class ClockWidget extends Component {
    constructor() {
        super();
        // update the clock every second
        setInterval(() => {
            this.rerender();
        }, 1000);
    }
    body() {
        let date = new Date();
        let h = date.getHours();
        let zeroPad = (n: number) => (n < 10 ? "0" + n : n.toString());
        let m = zeroPad(date.getMinutes());
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
        let hh = h % 12;
        if (hh == 0) {
            hh = 12;
        }
        return div(
            span(
                span(hh + ":" + m).class("cl-hm"),
                span(h >= 12 ? "PM" : "AM").class("cl-ampm")
            ).class("cl-time"),
            span(dateString).class("cl-date")
        ).class("clock");
    }
}
