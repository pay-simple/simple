const server = Bun.serve({
  port: 8000,
  // static: {
  //   "/": new Response(await Bun.file("./dist/index.js").bytes(), {
  //     headers: { "Content-Type": "text/javascript" },
  //   }),
  // },
  async fetch() {
    return new Response(await Bun.file("./dist/index.js").text());
  },
});

console.info(`Listening on ${server.url}`);
