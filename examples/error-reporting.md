# Be nice and report them errors

`mortal-webpack` is designed not to throw any exceptions at run-time, and the
way it communicates errors is in return values of function calls. When you
[[generate | compose]] configuration, the process may fail and then you're
expected to report those failures to the user through some means.

Out of the box, `mortal-webpack` ships an [[error reporter | reportErrors]]
that formats messages nicely, writes them to STDERR (or anywhere), and
optionally exit the process with a proper exit code to make it integrate with
shell tools.