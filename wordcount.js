function countWords(text) {
    var index = {},
        words = text
                .replace(/[.,?!;()"'-]/g, " ")
                .replace(/\s+/g, " ")
                .toLowerCase()
                .split(" ");
  
      words.forEach(function (word) {
          if (!(index.hasOwnProperty(word))) {
              index[word] = 0;
          }
          index[word]++;
      });
      return index;
}

// result example
index = {
    'στοιχεια': 3,
    'αιτησης': 1,
    'κωδικός': 1 
}


// call local
let text = 'bnjasfopgasfop[ vhsdophsdop fdghp hvodpsaghsop hvsdopghp hopdfhgao fdghp';
const counting = countWords(text);
console.log(counting)