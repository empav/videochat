var utils = {

    randomCode: function (n) {
        var array = Array("z","A","y","B","0","x","C","w","D","1","v","E","u","F","2","t","G","s","H","3","r",
            "I","q","J","4","p","K","o","L","n","M","m","N","l","O","k","P","5","j","Q","i","R","6",
            "h","S","g","T","7","f","U","e","V","8","d","W","c","X","9","b","Y","a","Z");
        var res = '';
        for(var i = 1; i <= n; i++) {
            res += array[Math.floor(Math.random() * array.length)];
        }
        return res;
    }

};

module.exports = utils;