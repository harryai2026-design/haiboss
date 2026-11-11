// A single RFC 9110 byte range. Unknown units are ignored; invalid byte ranges
// return null so callers can answer 416 without streaming the entire video.
export function byteRange(header,size){
 if(!header||!header.startsWith('bytes='))return undefined
 const match=/^bytes=(\d*)-(\d*)$/.exec(header)
 if(!match||(!match[1]&&!match[2])||size<=0)return null
 let start,end
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return null;start=Math.max(0,size-suffix);end=size-1}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return null;end=Math.min(end,size-1)}
 return {start,end}
}
