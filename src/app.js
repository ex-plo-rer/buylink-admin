const names = ["John", "Jane", "Jim", "Jill", "Jack"];


function shuffle(arr){
  return arr.sort(() => Math.random() - 0.5);
}

function shufflev2(arr){
  let newArr = [];
  while(arr.length > 0){
    let randomIndex = Math.floor(Math.random() * arr.length);
    newArr.push(arr[randomIndex]);
    arr.splice(randomIndex, 1);
  }
  return newArr;
}

function shufflev3(arr){
  let newArr = [];
  while(arr.length > 0){
    let randomIndex = Math.floor(Math.random() * arr.length);
    newArr.push(arr[randomIndex]);
    arr = arr.filter((_, index) => index !== randomIndex);
  }
  return newArr;
}

console.log(shufflev2(names))