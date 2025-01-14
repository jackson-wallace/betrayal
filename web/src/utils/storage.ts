export function getPlayerID() {
  let id = window.localStorage.getItem("id");

  if (!id) {
    id = "guest-" + crypto.randomUUID();
    window.localStorage.setItem("id", id);
  }

  return id;
}
