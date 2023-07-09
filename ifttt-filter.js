// Tweet when toot.
// This filter code skips tweeting if 'nocrosspost' is present
// in the given content.
// Use postNewTweet() if the content does not include an image.
// Use postNewTweetWithImage() if does include.
// Note that only the first image in the content is cross-posted.
const content = Feed.newFeedItem.EntryContent;
let payload = JSON.parse(MakerWebhooks.makeWebRequestQueryJson[0].ResponseBody);

// Something error happened with server. Fallback to text only mode.
if (!payload.images || !Array.isArray(payload.images)) {
    Twitter.postNewTweet.skip('failed to fetch mas2twimg api');
    Twitter.postNewTweetWithImage.skip('failed to fetch mas2twimg api');
    payload = { stop: true, images: [] }
}

// If nocrosspost is found in the content, skip actions
if (content.toLowerCase().indexOf('_nocrosspost_') !== -1) {

  Twitter.postNewTweet.skip('user set no cross post');
  Twitter.postNewTweetWithImage.skip('user set no cross post');
  payload = { stop: true, images: [] }

} else if (!payload.stop) { // Then post
  
  if (payload.images.length === 0) {

    // No image -> use postNewTweet()
    Twitter.postNewTweetWithImage.skip('no image found in toot');

  } else {

    // With image -> use postNewTweetWithImage(), skip plain text
    Twitter.postNewTweet.skip('one or more image is given');
    
    // Set tweet content
    Twitter.postNewTweetWithImage.setTweet(content);

    // Currently only support one image sadly :(
    //@ts-ignore
    payload.images.forEach(img => Twitter.postNewTweetWithImage.setPhotoUrl(img))
  }

}
