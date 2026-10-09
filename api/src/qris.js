export function normalizeQris(raw='') { return String(raw).replace(/[\r\n\t]/g,'').trim(); }

export function parseTLV(payload) {
  const fields=[]; let i=0;
  while(i<payload.length){
    if(i+4>payload.length)throw new Error('QRIS tidak valid: tag atau panjang tidak lengkap.');
    const id=payload.substring(i,i+2); const len=Number.parseInt(payload.substring(i+2,i+4),10);
    if(Number.isNaN(len)||len<0)throw new Error('QRIS tidak valid: panjang tag tidak valid.');
    const start=i+4; const end=start+len;
    if(end>payload.length)throw new Error('QRIS tidak valid: panjang data melebihi payload.');
    fields.push({id,len,value:payload.substring(start,end)}); i=end;
  }
  return fields;
}

function buildTLV(id,value){ return `${id}${String(value).length.toString().padStart(2,'0')}${value}`; }

function crc16(value){
  let crc=0xffff;
  for(let i=0;i<value.length;i++){
    crc^=value.charCodeAt(i)<<8;
    for(let j=0;j<8;j++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xffff:(crc<<1)&0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}

export function validateQris(raw){
  const qris=normalizeQris(raw);
  if(qris.length<30||!/^[\x20-\x7E]+$/.test(qris))throw new Error('QRIS terlalu pendek atau berisi karakter yang tidak valid.');
  const crcIndex=qris.lastIndexOf('6304');
  if(crcIndex===-1||crcIndex+8!==qris.length)throw new Error('QRIS tidak memiliki CRC yang valid.');
  parseTLV(qris);
  const expected=crc16(qris.slice(0,-4)); const actual=qris.slice(-4).toUpperCase();
  if(expected!==actual)throw new Error('CRC QRIS tidak cocok. Pastikan QRIS static ditempel lengkap.');
  const method=parseTLV(qris).find((field)=>field.id==='01')?.value;
  if(method!=='11')throw new Error('Gunakan QRIS static merchant, bukan QRIS dynamic.');
  return qris;
}

function issuerFromFields(fields){
  const merchantAccount=fields.find((field)=>{const id=Number.parseInt(field.id,10);return id>=26&&id<=51});
  if(!merchantAccount)return '';
  try{return parseTLV(merchantAccount.value).find((field)=>field.id==='00')?.value||''}catch{return ''}
}

export function getMerchantInfo(raw){
  const qris=normalizeQris(raw);
  if(!qris)return {merchant:'',city:'',postalCode:'',issuer:'',category:'',currency:'',method:'Static'};
  const fields=parseTLV(qris); const get=(id)=>fields.find((field)=>field.id===id)?.value||'';
  return {
    merchant:get('59'), city:get('60'), postalCode:get('61'), issuer:issuerFromFields(fields),
    category:get('52'), currency:get('53')==='360'?'IDR (Rupiah)':get('53'), method:get('01')==='12'?'Dynamic':'Static'
  };
}

export function convertToDynamic(raw,amount){
  const qris=validateQris(raw); const numeric=Number(amount);
  if(!Number.isFinite(numeric)||numeric<=0||numeric>100000000)throw new Error('Nominal pembayaran tidak valid.');
  const body=qris.slice(0,qris.lastIndexOf('6304')).replace('010211','010212');
  if(!body.includes('010212'))throw new Error('QRIS tidak memiliki metode pembayaran yang valid.');
  const insertAt=body.indexOf('5802');
  if(insertAt===-1)throw new Error('QRIS tidak memiliki country code.');
  const withAmount=body.slice(0,insertAt)+buildTLV('54',String(Math.floor(numeric)))+body.slice(insertAt);
  const withCrc=withAmount+'6304';
  return withCrc+crc16(withCrc);
}
