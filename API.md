
# Client API

An alphabetical list of methods, their arguments, return values and the emitted events.


## `accessRequest`
An request to grant access to a private forum for an anonymous user.

- `forumname`: name of the forum
- `username`: the email address for the user
- `message`: message for the forum admins

## `delete`
Deletes a given thread or reply.

- `path`: path to the reply or thread.

You must be admin or the owner of the post (in which case the post cannot be longer than 2.7 minutes old) before you can remove posts.

A "delete" event is fired.


## `forumUnwatch`
Unwatches all posts that the current user is following.

- `path`: the path of the current forum.


## `init`
This is usually the first call to initialize the application. Returns all the available data for a single forum illustrated here:

![Init return value properties](demo/img/init.png)

- `path`: the mount path such as "/goma/galleries". Root path (/goma) returns all the recent posts from all channels. *required*
- `expand_all`: whether all threads should be expanded by default. A common setting in commenting.
- `embedUrl`: the location where the forum is embedded. This is used on the links in email notifications.
- `search`: an object to query data. See below:
- `skip_truncate`: won't truncate the thread keys to 27 characters, which is the default setting.

#### The search object

- `version`: The version of the query syntax. Currently `1`.
- `path`: The path where to query from such as '/playground/tests',
- `filter`: Only return posts with this metadata. For example `{  assigned: 'courtney' }`,
- `sort`: The field used for sorting. For example `['priority']`



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

- `path`: the path of the post such as "/gom/gallery#who-likes-this-art"

Returns an array of post objects.



## `reply`
Posts a new reply to a thread.

- `path`: the path of the parent thread. *required*
- `body`: the message body as JavaScript array of paragraphs. *required*
- `key`: the id of the post. Shown on the address bar.
- `watch`: if `true` then the current users starts receiving email notifications about new replies.
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

## spam
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
- `key`: the id of the post. Shown on the address bar.
- `watch`: if `true` then the current users starts receiving email notifications about new replies.

Returns the possibly auto- generated key.

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

## unspam
Unmark a post from being spammed. The impact of this action depends on the user. Admin has the most power.

- `path`: the path of the post to be unspammed.


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


