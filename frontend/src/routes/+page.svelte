<script>
  let email = "";
  let submitted = false;

  function submit() {
    if (!email) return;
    submitted = true;
    email = "";
  }
</script>

<svelte:head>
  <title>Fallout</title>
  <meta
    name="description"
    content="Hardware hackathon in ShenZhen! Build 1 hour a day for 2 months, fly to China April 20-27, 2026"
  />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Fallout" />
  <meta
    property="og:description"
    content="A seven-day hardware hackathon in ShenZhen, China, April 20-27 2026. Design hardware projects, build them, & qualify!"
  />
  <meta property="og:image" content="" />
  <meta property="og:url" content="" />
  <meta property="og:site_name" content="Fallout" />
</svelte:head>

<section>
  <div>
    <img class="clouds" src="/landing/cloud.png" alt="" />
    <img class="city" src="/landing/building.png" alt="" />
  </div>

  <div class="cat-section">
    <img class="cat" src="/landing/cross+cat.png" alt="" />
    <div class="cat-bg"></div>
  </div>

  <div class="date">LATE APRIL 2026</div>
  <div><img class="logo" src="/landing/logo.png" alt="" /></div>
  <div class="tagline">
    a Hack Club <strong> hardware hackathon </strong> in Shenzhen
  </div>

  {#if submitted}
    <div class="success-message">
      Cheers! An email will be coming in 13 days...
    </div>
  {:else}
    <form class="signup" on:submit|preventDefault={submit}>
      <input
        class="email"
        type="email"
        bind:value={email}
        placeholder="enter your email..."
        required
      />

      <button class="go" aria-label="Submit"> &gt; </button>
    </form>
  {/if}
</section>
