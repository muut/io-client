
# Client API

An alphabetical list of methods names, their arguments, return values and the emitted events. All these method take this general pattern:

``` js
api.call('methodName', { param1: 'value', param2: 111, ... }, function(data) {

  // successfull call, data is the return value

}).done(function(data) {

  // you can chain multiple done calls

}).fail(function(error) {

  // an error occurred

}).always(function() {

  // this is called on error and on fail

})
```

## `accessList`

Get a list of users that are allowed to access the forum. Only valid for private forums.


- `forumname`: name of the forum such as "goma"
- `listRequested`: `true` to include access requests
- `listAccepted`: `true` to include accepted requests
- `listRejected`: `true` to include rejected requests


## `accessChange`

Accept or deny access for a user.

- `username`: user's username or email address
- `forumname`: name of the forum such as "goma"
- `status`: either 'accept' or 'deny'



## `accessRequest`
An request to grant access to a private forum for an anonymous user.

- `forumname`: the name of the forum such as "goma"
- `username`: the username or email address for the user
- `message`: message for the forum admins

For example:

``` js
api.call('accessRequest', {
  forumname: 'teron',
  username: 'yo@cc.com',
  message: 'This is it'

}, function(data) {
  // success

})
```

## `aclGrant`
Grant access rights for users.

- `paths`: the channels that the users are granted access to. Currently only the root path (`['/']`) is allowed.

- `rights`: the rights that are granted. Currently only moderator right is allowed, ie: `[ 'moderator' ]`.

Basically this is currently a "makeModerator" call, but we'll add more granularity later.


## `aclRevoke`
Remove access rights for users.

- `paths`: the channels that the users removed access from. Currently only the root path (`['/']`) is allowed .

- `rights`: the rights that are removed. Currently only moderator right is allowed, ie: `[ 'moderator' ]`.


## `bannedUsers`

Returns a list of banned users on a given forum.

- `forumname`: the name of the forum such as "goma"


## `banUser`

Marks the user as banned. A banned user can log in but isn't allowed to post, like or make any kind of updates to the forum.

- `username`: the username or email address of the banned the user
- `bantime`: the time in seconds for how long the user will be banned

If you want to "unban" a user set the `bantime` to a negative integer.


## `conversationPost `

Start a new private conversation.

- `forumname`: the name of the forum/project
- `participants`: an array of strings, the strings being the userid
- `body`: a content body up to 2500 characters

Returns conversationId


## `conversationList`

List private conversations.

- `forumname`: the name of the forum/project
- `start`: (optional) the start position to list from
- `count`: (optional) the number to return

Returns array of conversations


## `conversationOpen`

Open a single private conversation.

- `forumname`: the name of the forum/project
- `conversationId`: the id of the conversation to open
- `start`: (optional) the start position to list messages from in the conversation
- `count`: (optional) the number to of posts to return

Returns array of posts


## `conversationUserHide`

Block user from receiving messages.

- `username`: the user to hide future messages from (blocking essentially)
- `returns`: success status

## `conversationUserUnide`

Unblock user from receiving messages.

- `username`: the user to unhide future messages from (unblocking essentially)

Returns success status


## `conversationMute`

Mutes the conversation so that it is no longer "bumbed" on top of the list when new replies arrive and the participants won't receive any notification emails.

- `forumname`: the name of the forum/project
- `conversationId`: the id of the conversation to mute

Returns success status


## `conversationUnute`

Unmutes the conversation.

- `forumname`: the name of the forum/project
- `conversationId`: the id of the conversation to unmute

Returns success status


## `conversationHideList`

Returns a list of users whose messages are currently hidden. No params needed.


## `conversationPostRemove`

Removes a single post in private conversation

- `forumname`: the name of the forum/project
- `conversationId`: the id of the conversation to remove a post from
- `post`Id: the id of the post to remove in the conversation

Returns success status


## `conversationRemove`

Removes a private conversation

- `forumname`: the name of the forum/project
- `conversationId`: the id of the conversation to remove

Returns success status



## `delete`
Deletes a given thread or reply.

- `path`: path to the reply or thread.

You must be admin or the owner of the post (in which case the post cannot be longer than 2.7 minutes old) before you can remove posts.

A "delete" event is fired.


## `forumUnwatch`
Unwatches all posts that the current user is following.

- `path`: the path of the current forum.


## `init`
This method is called internally when the client is initialized. It returns all the available data for a single forum illustrated here:

![Init return value properties](demo/img/init.png)

- `path`: the mount path such as "/goma/galleries". Root path (/goma) returns all the recent posts from all channels. *required*
- `expand_all`: whether all threads should be expanded by default. A common setting in commenting.
- `embedUrl`: the location where the forum is embedded. This is used on the links in email notifications.
- `query`: an object to query data. See below:
- `skip_truncate`: won't truncate the thread keys to 27 characters, which is the default setting.

For example:

``` js
// called when user has succesfully logged in
api.on('login', function() {

  // re-initialize with the new "authenticated data"
  api.call('init', { path: '/goma', expand_all: true }, function(data) {


  })

})
```

#### The query parameter

You can attach any metadata to your posts and you can use the `query` parameter to filter and sort the returned data. This is only available for all trials and all plans of at least the **M** level and above.

- `version`: The version of the query syntax. Currently `1`.
- `path`: The path where to query from such as '/playground/tests',
- `filter`: Only return posts with this metadata. For example `{  assigned: 'courtney' }`,
- `sort`: The field used for sorting. For example `['priority']`

Here's an imaginary example to find artists with most stars:

``` js
api.call('init', {
  query: {
    version: 1,
    path: '/playground',
    filter: {
      'meta.public.str_tags': ['electric', 'techno'],
      'meta.public.str_city': ['berlin', 'rome']
    },
    sort: ['meta.public.stars']

}}, function(data) {


})
```


## `isAvailable`
Check whether given field is available (and not yet reserved). Here's how you check for a single field:

`this.call('isAvailable', { email: 'joo@cc.com' })`

Available fields are `username`, `email` and `name`.


## `like`
Like a given post and increase it's `like_count` and add an entry to the users that liked the post to be returned with `whoLikes` call.

- `path`: path to the liked post.

A "like" event is fired with path as the argument.


#### Like & create a new thread`
You can also create a new thread just by liking a certain path. On this case you need to provide additional parameters as follows:

- `path`: path of the thread such as "/goma/gallery#my-thread"
- `pageLocation`: the location of the page to be used on the email notification links
- `threadTitle`: the title of the thread
- `pageTitle`: the title of the hosting page


## `logout`
Logs out the current user and basic operations.

- `path`: the root path of the forum where to log out such as "/goma/" *required*
- `expand_all`: whether all threads should be expanded on the return value.

The new initial data where posts are in anonymous state.



## `more`
Gets the rest of the body if the post is large.

- `path`: path to the post.



## `moreReplies`
Get more replies for a given post

- `path`: the path of the post such as "/gom/gallery#who-likes-this-art".
- `start`: the start index of the results.
- `end`: the end index of the results.

Returns an array of post objects.



## `reply`
Posts a new reply to a thread.

- `path`: the path of the parent thread. *required*
- `body`: the message body as JavaScript array of paragraphs. *required*
- `key`: the id of the post. Shown on the address bar.
- `watch`: if `true` then the current users starts receiving email notifications about new replies.
- `pageLocation`: (required if `watch` is set to `true`) the location of the page to be used on the email notification links
- `pageTitle`: (required if `watch` is set to `true`) the title of the hosting page
- `mootTitle`: (required if `watch` is set to `true`) same as `pageTitle`
- `meta`: metadata for the post to be queried when filtering posts. For example `{ public: { foo: 899 }}`

Returns the possibly auto- generated key.

A "reply" event is fired with path and the reply object as arguments.


## `setCategories`
Sets forum categories, ie. the discussion areas.

- `path`: the forum path, such as "/goma"
- `categories`: array of categories. For example

```
[
  { title: 'Gallery', path: '/goma/gallery'},
  { title: 'Exhibitions', path: '/goma/exhibitions'},
  ...
]
```

A "categories" event is fired with the new categories as argument.


## `setMeta`
Set's metadata for a thread or post

- `path`:
- `meta`: metadata for the post to be queried when filtering posts. Example values:

```
{ 
  str_tags: ["support","questions","billing"],
  str_assigned: "johndoe",
  str_status: "open"
}
```

A "meta" event is fired with the metadata as argument.


## `setNotificationsDisable`
Disable all notifications for the user from a forum.

- `forumname`: name of the forum


## `setNotificationsEnable`
Disable all notifications for the user from a forum.

- `forumname`: name of the forum

## `spam`
Flag a post as spammed. The impact of this action depends on the user. Admin has the most power.

- `path`: the path of the post to be flagged as spam.


## `threadCollapse`
Collapses a thread so only the basic information of the thread is returned.

- `paths`: an array of thread paths to collapse.


## `threadCreate`
Creates a new thread

- `title`: message title. *required*
- `path`: the target channel. *required*
- `body`: the message body as array. each element in array represents a paragraph
- `key`: a human readable id for the post. If you leave this out the key is auto-generated on the server and returned on the call.
- `watch`: if `true` then the current users starts receiving email notifications about new replies.

Returns the possibly auto- generated key.

**NOTE** most calls on Muut require a `path` parameter. Thread path is constructed as follows:

`[channel_path]#[returned_key]`

For example "/playground/general#my-test-thread".

A "thread" event is fired with thread data as first argument and seed post data as the second argument.


## `threadExpand`
Expands a thread and loads the seed posts and the recent replies. The expanded state of each thread is remembered for authenticated users.

- `path`: a path to the thread to be expanded.


## `threadMove`
Move a thread from one channel to another.

- `src`: the original channel
- `dst`: the target channel



## `threadRetire`
Stops the thread from raising to the top (recent posts) when new replies are posted.

- `path`: the path of the retired thread.


## `threads`

Returns 10 most recent threads.

- `path`: the path of the channel such as "/goma/galleries" whose threads are returned.
- `expand_all`: whether all threads should be expanded by default.
- `start`: the start offset of the results. Default `0` – start from the beginning.
- `skip_truncate`: won't truncate the thread keys to 27 characters, which is the default setting.
- `query`: an object to query data. See [query parameter](#the-query-parameter).

Returns a list of thread objects.


## `threadUnretire`
Makes the thread behave normally so that it becomes the first on listings when new replies are posted.

- `path`: the path of the unretired thread.



## `threadUnwatch`
Stop receiving notifications from this trhread.

- `path`: the path of the unwatched thread.


## `threadWatch`
Start receiving notifications from this trhread.

- `path`: the path of the watched thread.


#### Watch & create a new thread
You can create a new thread just by watching a certain path. On this case you need to provide additional parameters as follows:

- `path`: path of the thread such as "/goma/gallery#my-thread"
- `pageLocation`: the location of the page to be used on the email notification links
- `threadTitle`: the title of the thread
- `pageTitle`: the title of the hosting page


## `type`
Notifies other people that the current user is typing a message.

- `path`: the path of the channel ("/goma/gallery") or thread ("/goma/gallery#my-thread")
- `size`: the amount of characters typed that is passed the notification event

A "type" event with the path and size information is fired.



## `unlike`
Unlike a post (take away the like flag).

- `path`: path to the unliked post.

An "unlike" event is fired with path as argument.

## `unspam`
Unmark a post from being spammed. The impact of this action depends on the user. Admin has the most power.

- `path`: the path of the post to be unspammed.

## `userFind`

Returns a list of users that matches a given username.

- `username` the username to look for


## `userHide`
Sets the user "invisible" so that the user is no longer listed on online user's list on the init return value.

A "leave" event is fired.


## `userShow`
Make the user visible on the online user list so that other people think the user is not online.

An "enter" event is fired.


## `userUpdate`
Updates the current user

- `displayname`: The display name field name.
- `email`: The new email address. A confirmation link is send.
- `img`: The uploaded avatar file name.
- `files`: the uploaded image as taken with `FileReader` on the client application. Supplied as single entry on an array `[ file ]`.


## `whoLikes`
Retreives the list of users that have liked the given post.

- `path`: path to the post.

Returns an array of user objects.


