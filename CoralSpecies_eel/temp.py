import matplotlib.pyplot as plt

# Sample data
list1 = [40, 68, 81, 137, 171, 227, 251, 271, 296, 326]
list2 = [44, 97, 145, 185, 242, 302, 332, 400, 472, 511]

# Create a range for the x-axis
x = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

# Plot the first line
plt.plot(x, list1, label='CoralSCAN')

# Plot the second line
plt.plot(x, list2, label='CPCe')

# Add labels and title
plt.xlabel('Number of Images')
plt.ylabel('Time (s)')
plt.title('Annotation Duration Comparison')

# Add a legend
plt.legend()

# Show the plot
plt.show()