export default class Util {
    static indent(string: string, by = 4) {
        return string
            .split("\n")
            .map((line) => " ".repeat(by) + line)
            .join("\n");
    }
}
