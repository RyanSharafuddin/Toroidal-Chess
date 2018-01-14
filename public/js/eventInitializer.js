var GLOBAL_NUMTIMES_LIST = (GLOBAL_NUMTIMES_LIST === undefined) ? {} : GLOBAL_NUMTIMES_LIST;
function initSocketEvents(filename, initializerFunction) {
  GLOBAL_NUMTIMES_LIST[filename] = (GLOBAL_NUMTIMES_LIST[filename] === undefined) ?  1 : GLOBAL_NUMTIMES_LIST[filename] + 1;
  if(GLOBAL_NUMTIMES_LIST[filename] == 1) {
    initializerFunction();
  }
  console.log("You have run " + filename + " " + GLOBAL_NUMTIMES_LIST[filename] + " times");
}
//in main ejs file, include in this order :
// 1) socket
// 2) socket events
// 3) event initializer
// 4) The files for that page.

//in all files that need sockets, in the main scope of the file,
// call initSocketEvents with filename and the init events function defined in the
// socket events file.
