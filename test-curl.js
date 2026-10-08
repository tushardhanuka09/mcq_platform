async function run() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6IfagulmZI8WIGWDocAoJzMulLiRxgHy2nv_M5DUp5dow');
  console.log(await res.json());
}
run();
