module.exports = {
    randomColor() {
        var color = Math.floor(Math.random() * 16777215).toString(16);
        color = "#" + ("000000" + color).slice(-6);
        console.log("Created custom color " + color)
        return color;
    }
}