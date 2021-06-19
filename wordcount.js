function main(params) {
	
	const text = params.content;
	const counting = countWords(text);

	    return {
	      body: {payload: counting},
	      statusCode: 200,
	      headers:{ 'Content-Type': 'application/json'}
	    };
}


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
