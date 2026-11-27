export default defineNuxtPlugin(async () => {
  await syncStoredUserProfile();
});
